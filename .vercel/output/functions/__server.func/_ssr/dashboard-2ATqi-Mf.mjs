import { t as ROLE_LABEL } from "./auth-helpers-BucyYuvz.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-BbVyVwjV.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { i as useAuth } from "./use-auth-eL2T4SAm.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, r as CardDescription, t as Card } from "./card-D3q4owDA.mjs";
import { F as BookOpen, N as Calendar, m as Megaphone, n as Users, r as TrendingUp, w as ClipboardCheck } from "../_libs/lucide-react.mjs";
import { i as Skeleton, t as AppShell } from "./AppShell-Di7ONok9.mjs";
import { t as Badge } from "./badge-B3f60TId.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { a as CartesianGrid, i as XAxis, l as ResponsiveContainer, n as BarChart, o as Bar, r as YAxis, u as Tooltip } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-2ATqi-Mf.js
var import_jsx_runtime = require_jsx_runtime();
function DashboardPage() {
	const { profile, role, user } = useAuth();
	const stats = useQuery({
		queryKey: [
			"dashboard-stats",
			role,
			user?.id
		],
		queryFn: async () => {
			const [notices, resources, events, students, teachers] = await Promise.all([
				supabase.from("notices").select("*", {
					count: "exact",
					head: true
				}),
				supabase.from("resources").select("*", {
					count: "exact",
					head: true
				}),
				supabase.from("events").select("*", {
					count: "exact",
					head: true
				}).eq("status", "upcoming"),
				supabase.from("user_roles").select("*", {
					count: "exact",
					head: true
				}).eq("role", "student"),
				supabase.from("user_roles").select("*", {
					count: "exact",
					head: true
				}).eq("role", "teacher")
			]);
			return {
				notices: notices.count ?? 0,
				resources: resources.count ?? 0,
				events: events.count ?? 0,
				students: students.count ?? 0,
				teachers: teachers.count ?? 0
			};
		}
	});
	const recent = useQuery({
		queryKey: ["recent-notices"],
		queryFn: async () => {
			const { data } = await supabase.from("notices").select("id,title,priority,created_at").order("created_at", { ascending: false }).limit(5);
			return data ?? [];
		}
	});
	const myAttendance = useQuery({
		queryKey: ["my-attendance", user?.id],
		enabled: role === "student" && !!user?.id,
		queryFn: async () => {
			const { data } = await supabase.from("attendance").select("subject,status").eq("student_id", user.id);
			const map = /* @__PURE__ */ new Map();
			(data ?? []).forEach((r) => {
				const cur = map.get(r.subject) ?? {
					present: 0,
					total: 0
				};
				cur.total += 1;
				if (r.status === "present") cur.present += 1;
				map.set(r.subject, cur);
			});
			return Array.from(map.entries()).map(([subject, v]) => ({
				subject,
				percent: Math.round(v.present / Math.max(v.total, 1) * 100)
			}));
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: `Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`,
		subtitle: `Signed in as ${ROLE_LABEL[role]}${profile?.department ? ` • ${profile.department}` : ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Notices",
					value: stats.data?.notices,
					icon: Megaphone,
					loading: stats.isLoading
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Resources",
					value: stats.data?.resources,
					icon: BookOpen,
					loading: stats.isLoading
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Upcoming events",
					value: stats.data?.events,
					icon: Calendar,
					loading: stats.isLoading
				}),
				role === "admin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Students",
					value: stats.data?.students,
					icon: Users,
					loading: stats.isLoading
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "Teachers",
					value: stats.data?.teachers,
					icon: Users,
					loading: stats.isLoading
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-4 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "lg:col-span-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
					className: "flex flex-row items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "font-display text-base",
						children: "Recent notices"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Latest announcements across the department." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/notices",
						className: "text-sm text-primary hover:underline",
						children: "View all →"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: recent.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2",
					children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-12 w-full" }, i))
				}) : recent.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-border",
					children: recent.data.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between gap-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm font-medium",
								children: n.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: new Date(n.created_at).toLocaleString()
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PriorityBadge, { priority: n.priority })]
					}, n.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "py-8 text-center text-sm text-muted-foreground",
					children: "No notices yet."
				}) })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "font-display text-base flex items-center gap-2",
				children: role === "student" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardCheck, { className: "h-4 w-4 text-primary" }), " Your attendance"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-4 w-4 text-primary" }), " Quick links"] })
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: role === "student" ? myAttendance.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48 w-full" }) : myAttendance.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-48",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
						data: myAttendance.data,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								strokeDasharray: "3 3",
								opacity: .2
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "subject",
								fontSize: 11
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
								domain: [0, 100],
								fontSize: 11
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
								background: "var(--popover)",
								border: "1px solid var(--border)",
								borderRadius: 8
							} }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "percent",
								fill: "var(--primary)",
								radius: [
									6,
									6,
									0,
									0
								]
							})
						]
					})
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-8 text-center text-sm text-muted-foreground",
				children: "No attendance recorded yet."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "space-y-2 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickLink, {
						to: "/notices",
						label: "Post a notice"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickLink, {
						to: "/resources",
						label: "Upload resources"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickLink, {
						to: "/events",
						label: "Create an event"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickLink, {
						to: "/attendance",
						label: "Mark attendance"
					}),
					role === "admin" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickLink, {
						to: "/admin",
						label: "Manage users"
					})
				]
			}) })] })]
		})]
	});
}
function StatCard({ label, value, icon: Icon, loading }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
		className: "surface-glow",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "flex items-center justify-between p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs uppercase tracking-wide text-muted-foreground",
				children: label
			}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-2 h-7 w-12" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 font-display text-2xl font-semibold",
				children: value ?? 0
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-5 w-5" })
			})]
		})
	});
}
function QuickLink({ to, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: "flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent/40 transition-colors",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted-foreground",
			children: "→"
		})]
	}) });
}
function PriorityBadge({ priority }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: {
			high: { v: "destructive" },
			medium: { v: "default" },
			low: { v: "secondary" }
		}[priority]?.v ?? "secondary",
		children: priority
	});
}
//#endregion
export { DashboardPage as component };
