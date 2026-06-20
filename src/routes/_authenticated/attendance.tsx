import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({ meta: [{ title: "Attendance — DeptPortal" }] }),
  component: AttendancePage,
});

function AttendancePage() {
  const { role } = useAuth();
  if (role === "student") return <StudentAttendance />;
  return <StaffAttendance />;
}

function StudentAttendance() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["my-attendance-full", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance").select("subject,date,status").eq("student_id", user!.id).order("date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const summary = useMemo(() => {
    const map = new Map<string, { present: number; total: number }>();
    (query.data ?? []).forEach((r) => {
      const cur = map.get(r.subject) ?? { present: 0, total: 0 };
      cur.total += 1;
      if (r.status === "present") cur.present += 1;
      map.set(r.subject, cur);
    });
    return Array.from(map.entries()).map(([subject, v]) => ({
      subject, present: v.present, total: v.total,
      percent: Math.round((v.present / Math.max(v.total, 1)) * 100),
    }));
  }, [query.data]);

  return (
    <AppShell title="My attendance" subtitle="Per-subject percentage and full history.">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {query.isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />) :
          summary.length ? summary.map((s) => (
            <Card key={s.subject} className="surface-glow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold">{s.subject}</h3>
                  <Badge variant={s.percent >= 75 ? "default" : "destructive"}>{s.percent}%</Badge>
                </div>
                <Progress value={s.percent} className="mt-3" />
                <p className="mt-2 text-xs text-muted-foreground">{s.present} of {s.total} classes attended</p>
              </CardContent>
            </Card>
          )) : (
            <Card className="md:col-span-3"><CardContent className="py-10 text-center text-sm text-muted-foreground">No attendance recorded yet.</CardContent></Card>
          )
        }
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="font-display text-base">History</CardTitle></CardHeader>
        <CardContent>
          {query.isLoading ? <Skeleton className="h-32 w-full" /> : query.data?.length ? (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Date</TableHead><TableHead>Subject</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {query.data.slice(0, 50).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                    <TableCell>{r.subject}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "present" ? "default" : "destructive"} className="capitalize">{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">No records.</p>}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function StaffAttendance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, "present" | "absent">>({});
  const [saving, setSaving] = useState(false);

  const students = useQuery({
    queryKey: ["all-students"],
    queryFn: async () => {
      // Fetch student roles + their profiles
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "student");
      const ids = (roles ?? []).map((r) => r.user_id);
      if (!ids.length) return [];
      const { data } = await supabase.from("profiles").select("id,full_name,roll_number,department,semester")
        .in("id", ids).order("roll_number");
      return data ?? [];
    },
  });

  async function loadExisting() {
    if (!subject || !date) return;
    const { data } = await supabase.from("attendance").select("student_id,status").eq("subject", subject).eq("date", date);
    const m: Record<string, "present" | "absent"> = {};
    (data ?? []).forEach((r) => { m[r.student_id] = r.status as "present" | "absent"; });
    setMarks(m);
  }

  async function save() {
    if (!subject) return toast.error("Pick a subject");
    if (!user) return;
    const rows = students.data?.map((s) => ({
      student_id: s.id,
      subject,
      date,
      status: marks[s.id] ?? "absent",
      marked_by: user.id,
    })) ?? [];
    if (!rows.length) return toast.error("No students");
    setSaving(true);
    const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "student_id,subject,date" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Saved attendance for ${rows.length} students`);
    qc.invalidateQueries({ queryKey: ["my-attendance"] });
    qc.invalidateQueries({ queryKey: ["my-attendance-full"] });
  }

  return (
    <AppShell
      title="Mark attendance"
      subtitle="Select subject and date, then mark each student."
      actions={
        <Button size="sm" onClick={save} disabled={saving || !subject}>
          {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} <Save className="mr-1 h-4 w-4" /> Save
        </Button>
      }
    >
      <Card className="mb-4">
        <CardContent className="grid gap-3 p-5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} onBlur={loadExisting} placeholder="e.g. Operating Systems" />
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} onBlur={loadExisting} />
          </div>
          <div className="flex items-end">
            <Button variant="outline" className="w-full" onClick={loadExisting}>Load existing</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {students.isLoading ? <Skeleton className="m-4 h-32" /> : students.data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Dept</TableHead>
                  <TableHead className="w-44">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.data.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.roll_number ?? "—"}</TableCell>
                    <TableCell>{s.full_name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{s.department ?? "—"}</TableCell>
                    <TableCell>
                      <Select value={marks[s.id] ?? ""} onValueChange={(v) => setMarks((m) => ({ ...m, [s.id]: v as "present" | "absent" }))}>
                        <SelectTrigger><SelectValue placeholder="Mark..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="py-10 text-center text-sm text-muted-foreground">No students enrolled yet.</p>}
        </CardContent>
      </Card>
    </AppShell>
  );
}
