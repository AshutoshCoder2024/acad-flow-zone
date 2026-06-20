import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, Users, FileText, Megaphone, Calendar as CalIcon } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip, Legend,
} from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { AppRole } from "@/lib/auth-helpers";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — DeptPortal" }] }),
  component: AdminGate,
});

function AdminGate() {
  const { role, loading } = useAuth();
  if (loading) return null;
  if (role !== "admin") return <Navigate to="/dashboard" />;
  return <AdminPanel />;
}

function AdminPanel() {
  const qc = useQueryClient();

  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [students, teachers, admins, notices, resources, events] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("notices").select("*", { count: "exact", head: true }),
        supabase.from("resources").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
      ]);
      return {
        students: students.count ?? 0, teachers: teachers.count ?? 0, admins: admins.count ?? 0,
        notices: notices.count ?? 0, resources: resources.count ?? 0, events: events.count ?? 0,
      };
    },
  });

  const users = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      const byUser = new Map<string, AppRole[]>();
      (roles ?? []).forEach((r) => {
        const arr = byUser.get(r.user_id) ?? [];
        arr.push(r.role as AppRole);
        byUser.set(r.user_id, arr);
      });
      return (profiles ?? []).map((p) => ({ ...p, roles: byUser.get(p.id) ?? [] }));
    },
  });

  async function setRole(userId: string, currentRoles: AppRole[], next: AppRole) {
    // Replace all roles with chosen single role
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) return toast.error(delErr.message);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: next });
    if (error) return toast.error(error.message);
    await supabase.from("activity_logs").insert({
      actor_id: (await supabase.auth.getUser()).data.user?.id,
      action: "role_change",
      entity: "user_roles",
      entity_id: userId,
      metadata: { from: currentRoles, to: next },
    });
    toast.success("Role updated");
    qc.invalidateQueries({ queryKey: ["all-users"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  const logs = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  const pieData = stats.data ? [
    { name: "Students", value: stats.data.students },
    { name: "Teachers", value: stats.data.teachers },
    { name: "Admins", value: stats.data.admins },
  ] : [];
  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

  return (
    <AppShell title="Admin Panel" subtitle="Manage users, view system statistics and activity.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Students" value={stats.data?.students} icon={Users} loading={stats.isLoading} />
        <StatTile label="Teachers" value={stats.data?.teachers} icon={Shield} loading={stats.isLoading} />
        <StatTile label="Notices" value={stats.data?.notices} icon={Megaphone} loading={stats.isLoading} />
        <StatTile label="Resources" value={stats.data?.resources} icon={FileText} loading={stats.isLoading} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-base">Users</CardTitle>
            <CardDescription>Promote, demote, or review accounts.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {users.isLoading ? <Skeleton className="m-4 h-40" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email / Roll</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead className="w-40">Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.data?.map((u) => {
                    const current = u.roles.includes("admin") ? "admin" : u.roles.includes("teacher") ? "teacher" : "student";
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {u.roll_number ? <span className="font-mono">{u.roll_number}</span> : u.email}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{u.department ?? "—"}</TableCell>
                        <TableCell>
                          <Select value={current} onValueChange={(v) => setRole(u.id, u.roles, v as AppRole)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="teacher">Teacher</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Role distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.isLoading ? <Skeleton className="h-48 w-full" /> : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <RTooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2"><CalIcon className="h-4 w-4 text-primary" /> Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.isLoading ? <Skeleton className="h-24 w-full" /> : logs.data?.length ? (
            <ul className="divide-y divide-border text-sm">
              {logs.data.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2">
                  <div>
                    <Badge variant="outline" className="mr-2">{l.action}</Badge>
                    <span className="text-muted-foreground text-xs">{l.entity}{l.entity_id ? ` • ${l.entity_id.slice(0, 8)}` : ""}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function StatTile({
  label, value, icon: Icon, loading,
}: { label: string; value: number | undefined; icon: typeof Shield; loading: boolean }) {
  return (
    <Card className="surface-glow">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="mt-2 h-7 w-12" /> : <p className="mt-1 font-display text-2xl font-semibold">{value ?? 0}</p>}
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
      </CardContent>
    </Card>
  );
}
