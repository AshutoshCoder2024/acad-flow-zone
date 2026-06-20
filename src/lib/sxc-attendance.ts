const ROMAN_SEMESTERS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"] as const;

export type AttendanceTab = "daily" | "monthly" | "overall";

export type SxcAttendancePayload = {
  examRollNo: string;
  semester: string;
  adNew?: string;
};

export type SxcSubjectSummary = {
  subject: string;
  total: number;
  attended: number;
  percent: number;
  period?: string;
  month?: string;
};

const SXC_ENDPOINTS: Record<AttendanceTab, string> = {
  daily: "https://sxcran.ac.in/Student/showDailyAttendance",
  monthly: "https://sxcran.ac.in/Student/showMonthlyAttendance",
  overall: "https://sxcran.ac.in/Student/showOverallAttendance",
};

export function semesterToRoman(semester: number | null | undefined): string {
  if (!semester || semester < 1) return "VI";
  return ROMAN_SEMESTERS[Math.min(semester - 1, ROMAN_SEMESTERS.length - 1)] ?? "VI";
}

export function romanToSemesterNumber(roman: string): number {
  const idx = ROMAN_SEMESTERS.indexOf(roman as (typeof ROMAN_SEMESTERS)[number]);
  return idx >= 0 ? idx + 1 : 6;
}

export function buildAttendanceBody(tab: AttendanceTab, payload: SxcAttendancePayload): string {
  const params = new URLSearchParams({
    examRollNo: payload.examRollNo.trim(),
    semester: payload.semester,
  });
  if (tab === "daily" && payload.adNew) params.set("adNew", payload.adNew);
  return params.toString();
}

export function getSxcEndpoint(tab: AttendanceTab): string {
  return SXC_ENDPOINTS[tab];
}

export function isApiRowArray(data: unknown): data is Record<string, string>[] {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === "object" &&
    data[0] !== null &&
    ("subjectCode" in data[0] || "subjectTitle" in data[0] || "attendance" in data[0])
  );
}

export function cleanSubjectTitle(raw: string | undefined): string {
  return (raw ?? "").replace(/\s*\[.*?\]\s*$/, "").trim();
}

export function parseAttendanceResponse(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.toLowerCase() === "null") return null;

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const json = JSON.parse(trimmed) as Record<string, unknown>;
      const maybeHtml =
        (typeof json.data === "string" && json.data) ||
        (typeof json.result === "string" && json.result) ||
        (typeof json.html === "string" && json.html);
      if (maybeHtml && maybeHtml.includes("<")) return parseHtmlTables(maybeHtml);
      return json;
    } catch {
      /* fall through */
    }
  }

  if (trimmed.includes("<")) return parseHtmlTables(trimmed);
  return { raw: trimmed };
}

function parseHtmlTables(html: string): { tables: string[][][] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const tables = Array.from(doc.querySelectorAll("table"))
    .map((table) =>
      Array.from(table.querySelectorAll("tr"))
        .map((row) =>
          Array.from(row.querySelectorAll("th,td")).map((cell) => cell.textContent?.trim() ?? ""),
        )
        .filter((row) => row.some(Boolean)),
    )
    .filter((t) => t.length > 0);
  return { tables };
}

export function aggregateDailyRows(rows: Record<string, string>[]): SxcSubjectSummary[] {
  const map = new Map<string, SxcSubjectSummary>();
  for (const item of rows) {
    const code = item.subjectCode || item.subjectTitle || "";
    const isPresent = item.attendance === "P";
    const existing = map.get(code);
    if (existing) {
      existing.total += 1;
      if (isPresent) existing.attended += 1;
      existing.percent = existing.total > 0 ? (existing.attended / existing.total) * 100 : 0;
    } else {
      map.set(code, {
        subject: cleanSubjectTitle(item.subjectTitle),
        total: 1,
        attended: isPresent ? 1 : 0,
        percent: isPresent ? 100 : 0,
        period: item.period,
      });
    }
  }
  return Array.from(map.values());
}

export function aggregateMonthlyRows(rows: Record<string, string>[]): SxcSubjectSummary[] {
  const map = new Map<string, SxcSubjectSummary>();
  for (const item of rows) {
    const code = item.subjectCode || item.subjectTitle || "";
    const total = parseInt(item.totalClasses || "0", 10);
    const attended = parseInt(item.totalPresent || "0", 10);
    const existing = map.get(code);
    if (existing) {
      existing.total += total;
      existing.attended += attended;
      existing.percent = existing.total > 0 ? (existing.attended / existing.total) * 100 : 0;
    } else {
      map.set(code, {
        subject: cleanSubjectTitle(item.subjectTitle),
        total,
        attended,
        percent: total > 0 ? (attended / total) * 100 : 0,
        month: item.monthValue || item.month,
      });
    }
  }
  return Array.from(map.values());
}

export function computeOverallTotals(items: SxcSubjectSummary[]) {
  const attended = items.reduce((s, i) => s + i.attended, 0);
  const total = items.reduce((s, i) => s + i.total, 0);
  const percent = total > 0 ? (attended / total) * 100 : 0;
  return { attended, total, percent };
}
