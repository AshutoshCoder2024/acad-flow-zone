import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, BookOpen, Calendar, ClipboardCheck, Users, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL } from "@/lib/auth-helpers";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — DeptPortal" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { profile, role, user } = useAuth();

  const stats = useQuery({
    queryKey: ["dashboard-stats", role, user?.id],
    queryFn: async () => {
      const [notices, resources, events, students, teachers] = await Promise.all([
        supabase.from("notices").select("*", { count: "exact", head: true }),
        supabase.from("resources").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "upcoming"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
      ]);
      return {
        notices: notices.count ?? 0,
        resources: resources.count ?? 0,
        events: events.count ?? 0,
        students: students.count ?? 0,
        teachers: teachers.count ?? 0,
      };
    },
  });

  const recent = useQuery({
    queryKey: ["recent-notices"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notices")
        .select("id,title,priority,created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const myAttendance = useQuery({
    queryKey: ["my-attendance", user?.id],
    enabled: role === "student" && !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance")
        .select("subject,status")
        .eq("student_id", user!.id);
      const map = new Map<string, { present: number; total: number }>();
      (data ?? []).forEach((r) => {
        const cur = map.get(r.subject) ?? { present: 0, total: 0 };
        cur.total += 1;
        if (r.status === "present") cur.present += 1;
        map.set(r.subject, cur);
      });
      return Array.from(map.entries()).map(([subject, v]) => ({
        subject,
        percent: Math.round((v.present / Math.max(v.total, 1)) * 100),
      }));
    },
  });

  return (
    <AppShell
      title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
      subtitle={`Signed in as ${ROLE_LABEL[role]}${profile?.department ? ` • ${profile.department}` : ""}`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Notices" value={stats.data?.notices} icon={Megaphone} loading={stats.isLoading} />
        <StatCard label="Resources" value={stats.data?.resources} icon={BookOpen} loading={stats.isLoading} />
        <StatCard label="Upcoming events" value={stats.data?.events} icon={Calendar} loading={stats.isLoading} />
        {role === "admin" ? (
          <StatCard label="Students" value={stats.data?.students} icon={Users} loading={stats.isLoading} />
        ) : (
          <StatCard label="Teachers" value={stats.data?.teachers} icon={Users} loading={stats.isLoading} />
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-base">Recent notices</CardTitle>
              <CardDescription>Latest announcements across the department.</CardDescription>
            </div>
            <Link to="/notices" className="text-sm text-primary hover:underline">View all →</Link>
          </CardHeader>
          <CardContent>
            {recent.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recent.data?.length ? (
              <ul className="divide-y divide-border">
                {recent.data.map((n) => (
                  <li key={n.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    <PriorityBadge priority={n.priority} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No notices yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              {role === "student" ? <><ClipboardCheck className="h-4 w-4 text-primary" /> Your attendance</> :
                <><TrendingUp className="h-4 w-4 text-primary" /> Quick links</>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {role === "student" ? (
              myAttendance.isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : myAttendance.data?.length ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={myAttendance.data}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="subject" fontSize={11} />
                      <YAxis domain={[0, 100]} fontSize={11} />
                      <Tooltip
                        contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }}
                      />
                      <Bar dataKey="percent" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No attendance recorded yet.</p>
              )
            ) : (
              <ul className="space-y-2 text-sm">
                <QuickLink to="/notices" label="Post a notice" />
                <QuickLink to="/resources" label="Upload resources" />
                <QuickLink to="/events" label="Create an event" />
                <QuickLink to="/attendance" label="Mark attendance" />
                {role === "admin" && <QuickLink to="/admin" label="Manage users" />}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({
  label, value, icon: Icon, loading,
}: { label: string; value: number | undefined; icon: typeof Megaphone; loading: boolean }) {
  return (
    <Card className="surface-glow">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-12" />
          ) : (
            <p className="mt-1 font-display text-2xl font-semibold">{value ?? 0}</p>
          )}
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <Link to={to} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent/40 transition-colors">
        <span>{label}</span>
        <span className="text-muted-foreground">→</span>
      </Link>
    </li>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { v: "default" | "secondary" | "destructive" | "outline"; c?: string }> = {
    high: { v: "destructive" },
    medium: { v: "default" },
    low: { v: "secondary" },
  };
  return <Badge variant={map[priority]?.v ?? "secondary"}>{priority}</Badge>;
}
