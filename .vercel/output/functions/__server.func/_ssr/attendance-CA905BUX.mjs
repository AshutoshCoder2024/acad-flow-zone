import { i as __toESM } from "../_runtime.mjs";
import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as supabase } from "./client-BbVyVwjV.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { a as objectType, o as stringType, r as enumType } from "../_libs/zod.mjs";
import { a as createSsrRpc, s as useAuth } from "./use-auth-11PuUOat.mjs";
import { r as cn, t as Button } from "./button-PwNqyxv_.mjs";
import { n as CardContent, o as Input, t as Card } from "./card-D3q4owDA.mjs";
import { M as ChartColumn, P as CalendarDays, g as LoaderCircle, j as ChartPie, l as Save, u as RefreshCw } from "../_libs/lucide-react.mjs";
import { i as Skeleton, t as AppShell } from "./AppShell-Bqd-FLq8.mjs";
import { t as Badge } from "./badge-B3f60TId.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-BcaWptOW.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DamjaduW.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-BeT0bXvu.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-CA_Ke5Cp.mjs";
import { n as Root, t as Indicator } from "../_libs/radix-ui__react-progress.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/attendance-CA905BUX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
var fetchSxcAttendance = createServerFn({ method: "POST" }).validator(attendanceRequestSchema).handler(createSsrRpc("14d7cdcc4af383c66848f97dacab19f072517fa77965d4042614e87c0f1b162f"));
var ROMAN_SEMESTERS$1 = [
	"I",
	"II",
	"III",
	"IV",
	"V",
	"VI",
	"VII",
	"VIII"
];
function semesterToRoman(semester) {
	if (!semester || semester < 1) return "VI";
	return ROMAN_SEMESTERS$1[Math.min(semester - 1, ROMAN_SEMESTERS$1.length - 1)] ?? "VI";
}
function isApiRowArray(data) {
	return Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && data[0] !== null && ("subjectCode" in data[0] || "subjectTitle" in data[0] || "attendance" in data[0]);
}
function cleanSubjectTitle(raw) {
	return (raw ?? "").replace(/\s*\[.*?\]\s*$/, "").trim();
}
function parseAttendanceResponse(raw) {
	const trimmed = raw.trim();
	if (!trimmed || trimmed.toLowerCase() === "null") return null;
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) try {
		const json = JSON.parse(trimmed);
		const maybeHtml = typeof json.data === "string" && json.data || typeof json.result === "string" && json.result || typeof json.html === "string" && json.html;
		if (maybeHtml && maybeHtml.includes("<")) return parseHtmlTables(maybeHtml);
		return json;
	} catch {}
	if (trimmed.includes("<")) return parseHtmlTables(trimmed);
	return { raw: trimmed };
}
function parseHtmlTables(html) {
	const doc = new DOMParser().parseFromString(html, "text/html");
	return { tables: Array.from(doc.querySelectorAll("table")).map((table) => Array.from(table.querySelectorAll("tr")).map((row) => Array.from(row.querySelectorAll("th,td")).map((cell) => cell.textContent?.trim() ?? "")).filter((row) => row.some(Boolean))).filter((t) => t.length > 0) };
}
function aggregateDailyRows(rows) {
	const map = /* @__PURE__ */ new Map();
	for (const item of rows) {
		const code = item.subjectCode || item.subjectTitle || "";
		const isPresent = item.attendance === "P";
		const existing = map.get(code);
		if (existing) {
			existing.total += 1;
			if (isPresent) existing.attended += 1;
			existing.percent = existing.total > 0 ? existing.attended / existing.total * 100 : 0;
		} else map.set(code, {
			subject: cleanSubjectTitle(item.subjectTitle),
			total: 1,
			attended: isPresent ? 1 : 0,
			percent: isPresent ? 100 : 0,
			period: item.period
		});
	}
	return Array.from(map.values());
}
function aggregateMonthlyRows(rows) {
	const map = /* @__PURE__ */ new Map();
	for (const item of rows) {
		const code = item.subjectCode || item.subjectTitle || "";
		const total = parseInt(item.totalClasses || "0", 10);
		const attended = parseInt(item.totalPresent || "0", 10);
		const existing = map.get(code);
		if (existing) {
			existing.total += total;
			existing.attended += attended;
			existing.percent = existing.total > 0 ? existing.attended / existing.total * 100 : 0;
		} else map.set(code, {
			subject: cleanSubjectTitle(item.subjectTitle),
			total,
			attended,
			percent: total > 0 ? attended / total * 100 : 0,
			month: item.monthValue || item.month
		});
	}
	return Array.from(map.values());
}
function computeOverallTotals(items) {
	const attended = items.reduce((s, i) => s + i.attended, 0);
	const total = items.reduce((s, i) => s + i.total, 0);
	return {
		attended,
		total,
		percent: total > 0 ? attended / total * 100 : 0
	};
}
var Progress = import_react.forwardRef(({ className, value, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	className: cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Indicator, {
		className: "h-full w-full flex-1 bg-primary transition-all",
		style: { transform: `translateX(-${100 - (value || 0)}%)` }
	})
}));
Progress.displayName = Root.displayName;
var ROMAN_SEMESTERS = [
	"I",
	"II",
	"III",
	"IV",
	"V",
	"VI",
	"VII",
	"VIII"
];
function AttendancePage() {
	const { role } = useAuth();
	if (role === "student") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudentAttendance, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaffAttendance, {});
}
function StudentAttendance() {
	const { profile } = useAuth();
	const defaultRoll = profile?.roll_number ?? "";
	const defaultSemester = semesterToRoman(profile?.semester);
	const [rollNumber, setRollNumber] = (0, import_react.useState)(defaultRoll);
	const [semester, setSemester] = (0, import_react.useState)(defaultSemester);
	const [date, setDate] = (0, import_react.useState)(() => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [tab, setTab] = (0, import_react.useState)("daily");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [daily, setDaily] = (0, import_react.useState)(null);
	const [monthly, setMonthly] = (0, import_react.useState)(null);
	const [overall, setOverall] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (rollNumber.trim()) handleFetchAll();
	}, []);
	const overallTotals = (0, import_react.useMemo)(() => overall ? computeOverallTotals(overall) : null, [overall]);
	async function loadAttendance(type) {
		if (!rollNumber.trim()) {
			toast.error("Enter your exam roll number");
			return null;
		}
		const result = await fetchSxcAttendance({ data: {
			type,
			examRollNo: rollNumber.trim(),
			semester,
			adNew: type === "daily" ? date : void 0
		} });
		if (!result.ok) throw new Error(`College portal returned HTTP ${result.status}`);
		const parsed = parseAttendanceResponse(result.text);
		if (isApiRowArray(parsed)) {
			if (type === "daily") return aggregateDailyRows(parsed);
			return aggregateMonthlyRows(parsed);
		}
		if (parsed && typeof parsed === "object" && "tables" in parsed) {
			const tables = parsed.tables;
			if (tables.length > 0 && tables[0].length > 1) return tables[0].slice(1).map((row) => ({
				subject: row[0] ?? "—",
				total: parseFloat(row[1] ?? "0") || 0,
				attended: parseFloat(row[2] ?? "0") || 0,
				percent: parseFloat(row[3]?.replace("%", "") ?? "0") || 0
			}));
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
			if (activeTab === "daily") setDaily(await loadAttendance("daily"));
			else if (activeTab === "monthly") setMonthly(await loadAttendance("monthly"));
			else setOverall(await loadAttendance("overall"));
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
				loadAttendance("overall")
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "My attendance",
		subtitle: "Live data from the SXC Ranchi student portal.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			size: "sm",
			onClick: handleFetchAll,
			disabled: loading,
			children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-1 h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "mr-1 h-4 w-4" }), "Refresh"]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "mb-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "roll",
								children: "Exam roll number"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "roll",
								value: rollNumber,
								onChange: (e) => setRollNumber(e.target.value),
								placeholder: "e.g. 23VBIT053786"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Semester" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: semester,
								onValueChange: setSemester,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: ROMAN_SEMESTERS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
									value: s,
									children: ["Semester ", s]
								}, s)) })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "date",
								children: "Date (daily view)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "date",
								type: "date",
								value: date,
								max: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
								onChange: (e) => setDate(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-end",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "w-full",
								onClick: handleFetchAll,
								disabled: loading,
								children: [loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Fetch attendance"]
							})
						})
					]
				})
			}),
			overallTotals && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCard, {
						label: "Overall %",
						value: `${Math.round(overallTotals.percent)}%`,
						icon: ChartPie
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCard, {
						label: "Classes attended",
						value: String(overallTotals.attended),
						icon: CalendarDays
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCard, {
						label: "Classes conducted",
						value: String(overallTotals.total),
						icon: ChartColumn
					})
				]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "mb-4 border-destructive/40",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "py-4 text-sm text-destructive",
					children: error
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				value: tab,
				onValueChange: (v) => {
					const next = v;
					setTab(next);
					if (next === "daily" && !daily) handleFetch("daily");
					if (next === "monthly" && !monthly) handleFetch("monthly");
					if (next === "overall" && !overall) handleFetch("overall");
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
						className: "grid w-full grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "daily",
								children: "Daily"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "monthly",
								children: "Monthly"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "overall",
								children: "Overall"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "daily",
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AttendanceList, {
							items: daily,
							loading: loading && tab === "daily",
							emptyLabel: "No classes recorded for this date.",
							showPeriod: true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "monthly",
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AttendanceList, {
							items: monthly,
							loading: loading && tab === "monthly",
							emptyLabel: "No monthly attendance data found."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "overall",
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AttendanceList, {
							items: overall,
							loading: loading && tab === "overall",
							emptyLabel: "No overall attendance data found."
						})
					})
				]
			})
		]
	});
}
function SummaryCard({ label, value, icon: Icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
		className: "surface-glow",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "flex items-center justify-between p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs uppercase tracking-wide text-muted-foreground",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 font-display text-2xl font-semibold",
				children: value
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-5 w-5" })
			})]
		})
	});
}
function AttendanceList({ items, loading, emptyLabel, showPeriod }) {
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-3",
		children: Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-full" }, i))
	});
	if (!items) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
		className: "py-10 text-center text-sm text-muted-foreground",
		children: "Enter your roll number and click Fetch attendance."
	}) });
	if (!items.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
		className: "py-10 text-center text-sm text-muted-foreground",
		children: emptyLabel
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-3",
		children: items.map((item) => {
			const pct = Math.round(item.percent);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-display font-semibold",
								children: item.subject
							}),
							showPeriod && item.period && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: ["Period ", item.period]
							}),
							item.month && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: item.month
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							variant: pct >= 75 ? "default" : "destructive",
							children: [pct, "%"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
						value: Math.min(pct, 100),
						className: "mt-3"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-xs text-muted-foreground",
						children: [
							item.attended,
							" of ",
							item.total,
							" classes attended"
						]
					})
				]
			}) }, `${item.subject}-${item.period ?? ""}-${item.month ?? ""}`);
		})
	});
}
function StaffAttendance() {
	const { user } = useAuth();
	const qc = useQueryClient();
	const [subject, setSubject] = (0, import_react.useState)("");
	const [date, setDate] = (0, import_react.useState)(() => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [marks, setMarks] = (0, import_react.useState)({});
	const [saving, setSaving] = (0, import_react.useState)(false);
	const students = useQuery({
		queryKey: ["all-students"],
		queryFn: async () => {
			const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "student");
			const ids = (roles ?? []).map((r) => r.user_id);
			if (!ids.length) return [];
			const { data } = await supabase.from("profiles").select("id,full_name,roll_number,department,semester").in("id", ids).order("roll_number");
			return data ?? [];
		}
	});
	async function loadExisting() {
		if (!subject || !date) return;
		const { data } = await supabase.from("attendance").select("student_id,status").eq("subject", subject).eq("date", date);
		const m = {};
		(data ?? []).forEach((r) => {
			m[r.student_id] = r.status;
		});
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
			marked_by: user.id
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Mark attendance",
		subtitle: "Select subject and date, then mark each student.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			size: "sm",
			onClick: save,
			disabled: saving || !subject,
			children: [
				saving && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-1 h-4 w-4 animate-spin" }),
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "mr-1 h-4 w-4" }),
				" Save"
			]
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
			className: "mb-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "grid gap-3 p-5 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Subject" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: subject,
							onChange: (e) => setSubject(e.target.value),
							onBlur: loadExisting,
							placeholder: "e.g. Operating Systems"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							value: date,
							onChange: (e) => setDate(e.target.value),
							onBlur: loadExisting
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-end",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "w-full",
							onClick: loadExisting,
							children: "Load existing"
						})
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
			className: "p-0",
			children: students.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "m-4 h-32" }) : students.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Roll" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Name" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Dept" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "w-44",
					children: "Status"
				})
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: students.data.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "font-mono text-xs",
					children: s.roll_number ?? "—"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: s.full_name }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-muted-foreground text-xs",
					children: s.department ?? "—"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: marks[s.id] ?? "",
					onValueChange: (v) => setMarks((m) => ({
						...m,
						[s.id]: v
					})),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Mark..." }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "present",
						children: "Present"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "absent",
						children: "Absent"
					})] })]
				}) })
			] }, s.id)) })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-10 text-center text-sm text-muted-foreground",
				children: "No students enrolled yet."
			})
		}) })]
	});
}
//#endregion
export { AttendancePage as component };
