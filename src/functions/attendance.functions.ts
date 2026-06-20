import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const attendanceRequestSchema = z.object({
  type: z.enum(["daily", "monthly", "overall"]),
  examRollNo: z.string().trim().min(1).max(40),
  semester: z.string().trim().min(1).max(10),
  adNew: z.string().trim().optional(),
});

const UPSTREAM_URLS = {
  daily: "https://sxcran.ac.in/Student/showDailyAttendance",
  monthly: "https://sxcran.ac.in/Student/showMonthlyAttendance",
  overall: "https://sxcran.ac.in/Student/showOverallAttendance",
} as const;

export const fetchSxcAttendance = createServerFn({ method: "POST" })
  .validator(attendanceRequestSchema)
  .handler(async ({ data }) => {
    const body = new URLSearchParams({
      examRollNo: data.examRollNo,
      semester: data.semester,
    });
    if (data.type === "daily" && data.adNew) body.set("adNew", data.adNew);

    const response = await fetch(UPSTREAM_URLS[data.type], {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        Referer: "https://sxcran.ac.in/Student/AttendanceSummary",
      },
      body: body.toString(),
    });

    return {
      ok: response.ok,
      status: response.status,
      text: await response.text(),
    };
  });
