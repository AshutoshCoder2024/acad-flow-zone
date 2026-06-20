import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, RefreshCw, CalendarDays, BarChart3, PieChart } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fetchSxcAttendance } from "@/functions/attendance.functions";
import {
  aggregateDailyRows,
  aggregateMonthlyRows,
  computeOverallTotals,
  isApiRowArray,
  parseAttendanceResponse,
  semesterToRoman,
  type AttendanceTab,
  type SxcSubjectSummary,
} from "@/lib/sxc-attendance";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const ROMAN_SEMESTERS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"] as const;

function AttendancePage() {
  const { role } = useAuth();
  if (role === "student") return <StudentAttendance />;
  return <StaffAttendance />;
}

function StudentAttendance() {
  const { profile } = useAuth();
  const defaultRoll = profile?.roll_number ?? "";
  const defaultSemester = semesterToRoman(profile?.semester);

  const [rollNumber, setRollNumber] = useState(defaultRoll);
  const [semester, setSemester] = useState(defaultSemester);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tab, setTab] = useState<AttendanceTab>("daily");
  const [loading, setLoading] = useState(false);
  const [daily, setDaily] = useState<SxcSubjectSummary[] | null>(null);
  const [monthly, setMonthly] = useState<SxcSubjectSummary[] | null>(null);
  const [overall, setOverall] = useState<SxcSubjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rollNumber.trim()) handleFetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only when roll is known
  }, []);

  const overallTotals = useMemo(
    () => (overall ? computeOverallTotals(overall) : null),
    [overall],
  );

  async function loadAttendance(type: AttendanceTab) {
    if (!rollNumber.trim()) {
      toast.error("Enter your exam roll number");
      return null;
    }

    const result = await fetchSxcAttendance({
      data: {
        type,
        examRollNo: rollNumber.trim(),
        semester,
        adNew: type === "daily" ? date : undefined,
      },
    });

    if (!result.ok) {
      throw new Error(`College portal returned HTTP ${result.status}`);
    }

    const parsed = parseAttendanceResponse(result.text);
    if (isApiRowArray(parsed)) {
      if (type === "daily") return aggregateDailyRows(parsed);
      return aggregateMonthlyRows(parsed);
    }

    if (parsed && typeof parsed === "object" && "tables" in parsed) {
      const tables = (parsed as { tables: string[][][] }).tables;
      if (tables.length > 0 && tables[0].length > 1) {
        return tables[0].slice(1).map((row) => ({
          subject: row[0] ?? "—",
          total: parseFloat(row[1] ?? "0") || 0,
          attended: parseFloat(row[2] ?? "0") || 0,
          percent: parseFloat(row[3]?.replace("%", "") ?? "0") || 0,
        }));
      }
    }

    return [];
  }

  async function handleFetch(activeTab = tab) {
    if (!rollNumber.trim()) {
      toast.error("Enter your exam roll number");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (activeTab === "daily") {
        setDaily(await loadAttendance("daily"));
      } else if (activeTab === "monthly") {
        setMonthly(await loadAttendance("monthly"));
      } else {
        setOverall(await loadAttendance("overall"));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch attendance";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchAll() {
    if (!rollNumber.trim()) {
      toast.error("Enter your exam roll number");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [dailyData, monthlyData, overallData] = await Promise.all([
        loadAttendance("daily"),
        loadAttendance("monthly"),
        loadAttendance("overall"),
      ]);
      setDaily(dailyData);
      setMonthly(monthlyData);
      setOverall(overallData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch attendance";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="My attendance"
      subtitle="Live data from the SXC Ranchi student portal."
      actions={
        <Button size="sm" onClick={handleFetchAll} disabled={loading}>
          {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}
          Refresh
        </Button>
      }
    >
      <Card className="mb-4">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="roll">Exam roll number</Label>
            <Input
              id="roll"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="e.g. 23VBIT053786"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Semester</Label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROMAN_SEMESTERS.map((s) => (
                  <SelectItem key={s} value={s}>Semester {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Date (daily view)</Label>
            <Input id="date" type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={handleFetchAll} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fetch attendance
            </Button>
          </div>
        </CardContent>
      </Card>

      {overallTotals && (
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Overall %" value={`${Math.round(overallTotals.percent)}%`} icon={PieChart} />
          <SummaryCard label="Classes attended" value={String(overallTotals.attended)} icon={CalendarDays} />
          <SummaryCard label="Classes conducted" value={String(overallTotals.total)} icon={BarChart3} />
        </div>
      )}

      {error && (
        <Card className="mb-4 border-destructive/40">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = v as AttendanceTab;
          setTab(next);
          if (next === "daily" && !daily) handleFetch("daily");
          if (next === "monthly" && !monthly) handleFetch("monthly");
          if (next === "overall" && !overall) handleFetch("overall");
        }}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="overall">Overall</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4">
          <AttendanceList items={daily} loading={loading && tab === "daily"} emptyLabel="No classes recorded for this date." showPeriod />
        </TabsContent>
        <TabsContent value="monthly" className="mt-4">
          <AttendanceList items={monthly} loading={loading && tab === "monthly"} emptyLabel="No monthly attendance data found." />
        </TabsContent>
        <TabsContent value="overall" className="mt-4">
          <AttendanceList items={overall} loading={loading && tab === "overall"} emptyLabel="No overall attendance data found." />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof PieChart;
}) {
  return (
    <Card className="surface-glow">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function AttendanceList({
  items,
  loading,
  emptyLabel,
  showPeriod,
}: {
  items: SxcSubjectSummary[] | null;
  loading: boolean;
  emptyLabel: string;
  showPeriod?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!items) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Enter your roll number and click Fetch attendance.
        </CardContent>
      </Card>
    );
  }

  if (!items.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">{emptyLabel}</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const pct = Math.round(item.percent);
        return (
          <Card key={`${item.subject}-${item.period ?? ""}-${item.month ?? ""}`}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-semibold">{item.subject}</h3>
                  {showPeriod && item.period && (
                    <p className="text-xs text-muted-foreground">Period {item.period}</p>
                  )}
                  {item.month && (
                    <p className="text-xs text-muted-foreground">{item.month}</p>
                  )}
                </div>
                <Badge variant={pct >= 75 ? "default" : "destructive"}>{pct}%</Badge>
              </div>
              <Progress value={Math.min(pct, 100)} className="mt-3" />
              <p className="mt-2 text-xs text-muted-foreground">
                {item.attended} of {item.total} classes attended
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
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
