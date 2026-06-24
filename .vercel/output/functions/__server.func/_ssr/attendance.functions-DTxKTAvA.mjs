import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { o as objectType, r as enumType, s as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/attendance.functions-DTxKTAvA.js
var attendanceRequestSchema = objectType({
	type: enumType([
		"daily",
		"monthly",
		"overall"
	]),
	examRollNo: stringType().trim().min(1).max(40),
	semester: stringType().trim().min(1).max(10),
	adNew: stringType().trim().optional()
});
var UPSTREAM_URLS = {
	daily: "https://sxcran.ac.in/Student/showDailyAttendance",
	monthly: "https://sxcran.ac.in/Student/showMonthlyAttendance",
	overall: "https://sxcran.ac.in/Student/showOverallAttendance"
};
var fetchSxcAttendance_createServerFn_handler = createServerRpc({
	id: "14d7cdcc4af383c66848f97dacab19f072517fa77965d4042614e87c0f1b162f",
	name: "fetchSxcAttendance",
	filename: "src/functions/attendance.functions.ts"
}, (opts) => fetchSxcAttendance.__executeServer(opts));
var fetchSxcAttendance = createServerFn({ method: "POST" }).validator(attendanceRequestSchema).handler(fetchSxcAttendance_createServerFn_handler, async ({ data }) => {
	const body = new URLSearchParams({
		examRollNo: data.examRollNo,
		semester: data.semester
	});
	if (data.type === "daily" && data.adNew) body.set("adNew", data.adNew);
	const response = await fetch(UPSTREAM_URLS[data.type], {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Accept: "application/json, text/javascript, */*; q=0.01",
			"X-Requested-With": "XMLHttpRequest",
			Referer: "https://sxcran.ac.in/Student/AttendanceSummary"
		},
		body: body.toString()
	});
	return {
		ok: response.ok,
		status: response.status,
		text: await response.text()
	};
});
//#endregion
export { fetchSxcAttendance_createServerFn_handler };
