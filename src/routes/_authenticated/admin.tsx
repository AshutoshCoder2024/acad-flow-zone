import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, Users, Megaphone, Calendar as CalIcon, Check, X, Clock } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip, Legend,
} from "recharts";

import { useAuth } from "@/hooks/use-auth";
import {
  adminApproveTeacher,
  adminRejectTeacher,
  adminSetUserRole,
  fetchAdminDashboard,
} from "@/functions/admin-api.functions";
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
import { Button } from "@/components/ui/button";
import type { AppRole } from "@/lib/auth-helpers";
import { VERIFICATION_LABEL } from "@/lib/auth-helpers";

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
  const { adminToken } = useAuth();
  const qc = useQueryClient();

  const dashboard = useQuery({
    queryKey: ["admin-dashboard", adminToken],
    enabled: !!adminToken,
    queryFn: async () => fetchAdminDashboard({ data: { token: adminToken! } }),
  });

  async function approveTeacher(userId: string, fullName: string) {
    if (!adminToken) return;
    try {
      await adminApproveTeacher({ data: { token: adminToken, userId, fullName } });
      toast.success(`${fullName} approved as teacher`);
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed");
    }
  }

  async function rejectTeacher(userId: string, fullName: string) {
    if (!adminToken) return;
    try {
      await adminRejectTeacher({ data: { token: adminToken, userId, fullName } });
      toast.success(`${fullName} rejected`);
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rejection failed");
    }
  }

  async function setRole(userId: string, currentRoles: AppRole[], next: AppRole) {
    if (!adminToken) return;
    try {
      await adminSetUserRole({
        data: { token: adminToken, userId, currentRoles, nextRole: next },
      });
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Role update failed");
    }
  }

  if (!adminToken) {
    return (
      <AppShell title="Admin Panel" subtitle="Administrator session required.">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Sign in again using the Admin tab with your .env credentials.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  if (dashboard.isError) {
    const message = dashboard.error instanceof Error ? dashboard.error.message : "Failed to load admin data";
    return (
      <AppShell title="Admin Panel" subtitle="Manage users, view system statistics and activity.">
        <Card className="border-destructive/40">
          <CardContent className="py-8 text-center text-sm">
            <p className="text-destructive">{message}</p>
            <p className="mt-2 text-muted-foreground">
              Add SUPABASE_SERVICE_ROLE_KEY to your .env file so the admin panel can manage users.
            </p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const stats = dashboard.data?.stats;
  const users = dashboard.data?.users ?? [];
  const pendingTeachers = dashboard.data?.pendingTeachers ?? [];
  const logs = dashboard.data?.logs ?? [];

  const pieData = stats ? [
    { name: "Students", value: stats.students },
    { name: "Teachers", value: stats.teachers },
    { name: "Admins", value: stats.admins },
  ] : [];
  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

  return (
    <AppShell title="Admin Panel" subtitle="Manage users, view system statistics and activity.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Students" value={stats?.students} icon={Users} loading={dashboard.isLoading} />
        <StatTile label="Teachers" value={stats?.teachers} icon={Shield} loading={dashboard.isLoading} />
        <StatTile label="Pending teachers" value={pendingTeachers.length} icon={Clock} loading={dashboard.isLoading} />
        <StatTile label="Notices" value={stats?.notices} icon={Megaphone} loading={dashboard.isLoading} />
      </div>

      <Card className="mt-6 border-amber-500/30">
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            Teacher registration requests
            {!dashboard.isLoading && pendingTeachers.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingTeachers.length} pending</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Approve or reject teachers who registered through the portal. Approved teachers can sign in immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {dashboard.isLoading ? (
            <Skeleton className="m-4 h-24" />
          ) : pendingTeachers.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-48 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTeachers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.full_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.email}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.department ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 hover:text-green-800"
                          onClick={() => approveTeacher(t.id, t.full_name)}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => rejectTeacher(t.id, t.full_name)}
                        >
                          <X className="mr-1 h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              No pending teacher requests. New registrations will appear here for review.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-base">Users</CardTitle>
            <CardDescription>Promote, demote, or review accounts.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {dashboard.isLoading ? <Skeleton className="m-4 h-40" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email / Roll</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-40">Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const current = u.roles.includes("admin") ? "admin" : u.roles.includes("teacher") ? "teacher" : "student";
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {u.roll_number ? <span className="font-mono">{u.roll_number}</span> : u.email}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{u.department ?? "—"}</TableCell>
                        <TableCell>
                          {u.verification_status && u.verification_status !== "not_applicable" ? (
                            <Badge
                              variant={
                                u.verification_status === "approved"
                                  ? "default"
                                  : u.verification_status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {VERIFICATION_LABEL[u.verification_status as keyof typeof VERIFICATION_LABEL]}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
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
            {dashboard.isLoading ? <Skeleton className="h-48 w-full" /> : (
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
          {dashboard.isLoading ? <Skeleton className="h-24 w-full" /> : logs.length ? (
            <ul className="divide-y divide-border text-sm">
              {logs.map((l) => (
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
