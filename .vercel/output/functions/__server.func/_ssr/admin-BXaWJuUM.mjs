import { _ as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { a as objectType, o as stringType, r as enumType, t as arrayType } from "../_libs/zod.mjs";
import { a as createSsrRpc, r as VERIFICATION_LABEL, s as useAuth } from "./use-auth-11PuUOat.mjs";
import { t as Button } from "./button-PwNqyxv_.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, r as CardDescription, t as Card } from "./card-D3q4owDA.mjs";
import { A as Check, C as Clock, N as Calendar, m as Megaphone, n as Users, o as Shield, t as X } from "../_libs/lucide-react.mjs";
import { i as Skeleton, t as AppShell } from "./AppShell-Bqd-FLq8.mjs";
import { t as Badge } from "./badge-B3f60TId.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-BcaWptOW.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DamjaduW.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as Cell, d as Legend, l as ResponsiveContainer, s as Pie, t as PieChart, u as Tooltip } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-BXaWJuUM.js
var import_jsx_runtime = require_jsx_runtime();
var tokenOnly = objectType({ token: stringType().min(1) });
var approveSchema = objectType({
	token: stringType().min(1),
	userId: stringType().uuid(),
	fullName: stringType().min(1)
});
var rejectSchema = approveSchema;
var setRoleSchema = objectType({
	token: stringType().min(1),
	userId: stringType().uuid(),
	currentRoles: arrayType(enumType([
		"student",
		"teacher",
		"admin"
	])),
	nextRole: enumType([
		"student",
		"teacher",
		"admin"
	])
});
var fetchAdminDashboard = createServerFn({ method: "POST" }).validator(tokenOnly).handler(createSsrRpc("c664209477ed7421d781473e2e872dbe9c45c2e41225424a324062e8b63e0367"));
var adminApproveTeacher = createServerFn({ method: "POST" }).validator(approveSchema).handler(createSsrRpc("aa43677ae01abaef43705634754a0d41438c6318198a6fc9b26560d4437693d5"));
var adminRejectTeacher = createServerFn({ method: "POST" }).validator(rejectSchema).handler(createSsrRpc("828c9b6436ea019fd107cccecb9ff63e07a29131f42fdf1255da0724f373f1f3"));
var adminSetUserRole = createServerFn({ method: "POST" }).validator(setRoleSchema).handler(createSsrRpc("40467fa194e16826a5416dfe58a994f06315cee58c928f1a80f231a639f9a781"));
function AdminGate() {
	const { role, loading } = useAuth();
	if (loading) return null;
	if (role !== "admin") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/dashboard" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminPanel, {});
}
function AdminPanel() {
	const { adminToken } = useAuth();
	const qc = useQueryClient();
	const dashboard = useQuery({
		queryKey: ["admin-dashboard", adminToken],
		enabled: !!adminToken,
		queryFn: async () => fetchAdminDashboard({ data: { token: adminToken } })
	});
	async function approveTeacher(userId, fullName) {
		if (!adminToken) return;
		try {
			await adminApproveTeacher({ data: {
				token: adminToken,
				userId,
				fullName
			} });
			toast.success(`${fullName} approved as teacher`);
			qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Approval failed");
		}
	}
	async function rejectTeacher(userId, fullName) {
		if (!adminToken) return;
		try {
			await adminRejectTeacher({ data: {
				token: adminToken,
				userId,
				fullName
			} });
			toast.success(`${fullName} rejected`);
			qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Rejection failed");
		}
	}
	async function setRole(userId, currentRoles, next) {
		if (!adminToken) return;
		try {
			await adminSetUserRole({ data: {
				token: adminToken,
				userId,
				currentRoles,
				nextRole: next
			} });
			toast.success("Role updated");
			qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Role update failed");
		}
	}
	if (!adminToken) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Admin Panel",
		subtitle: "Administrator session required.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
			className: "py-10 text-center text-sm text-muted-foreground",
			children: "Sign in again using the Admin tab with your .env credentials."
		}) })
	});
	if (dashboard.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Admin Panel",
		subtitle: "Manage users, view system statistics and activity.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
			className: "border-destructive/40",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "py-8 text-center text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-destructive",
					children: dashboard.error instanceof Error ? dashboard.error.message : "Failed to load admin data"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-muted-foreground",
					children: "Add SUPABASE_SERVICE_ROLE_KEY to your .env file so the admin panel can manage users."
				})]
			})
		})
	});
	const stats = dashboard.data?.stats;
	const users = dashboard.data?.users ?? [];
	const pendingTeachers = dashboard.data?.pendingTeachers ?? [];
	const logs = dashboard.data?.logs ?? [];
	const pieData = stats ? [
		{
			name: "Students",
			value: stats.students
		},
		{
			name: "Teachers",
			value: stats.teachers
		},
		{
			name: "Admins",
			value: stats.admins
		}
	] : [];
	const COLORS = [
		"var(--chart-1)",
		"var(--chart-2)",
		"var(--chart-3)"
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Admin Panel",
		subtitle: "Manage users, view system statistics and activity.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Students",
						value: stats?.students,
						icon: Users,
						loading: dashboard.isLoading
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Teachers",
						value: stats?.teachers,
						icon: Shield,
						loading: dashboard.isLoading
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Pending teachers",
						value: pendingTeachers.length,
						icon: Clock,
						loading: dashboard.isLoading
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
						label: "Notices",
						value: stats?.notices,
						icon: Megaphone,
						loading: dashboard.isLoading
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-6 border-amber-500/30",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
					className: "font-display text-base flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-4 w-4 text-amber-600" }),
						"Teacher registration requests",
						!dashboard.isLoading && pendingTeachers.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							variant: "secondary",
							className: "ml-1",
							children: [pendingTeachers.length, " pending"]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Approve or reject teachers who registered through the portal. Approved teachers can sign in immediately." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "p-0",
					children: dashboard.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "m-4 h-24" }) : pendingTeachers.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Name" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Email" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Department" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Submitted" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "w-48 text-right",
							children: "Actions"
						})
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: pendingTeachers.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "font-medium",
							children: t.full_name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-xs text-muted-foreground",
							children: t.email
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-xs text-muted-foreground",
							children: t.department ?? "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-xs text-muted-foreground",
							children: new Date(t.created_at).toLocaleString()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-right",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-end gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "outline",
									className: "text-green-700 hover:text-green-800",
									onClick: () => approveTeacher(t.id, t.full_name),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mr-1 h-3.5 w-3.5" }), "Approve"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "outline",
									className: "text-destructive hover:text-destructive",
									onClick: () => rejectTeacher(t.id, t.full_name),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "mr-1 h-3.5 w-3.5" }), "Reject"]
								})]
							})
						})
					] }, t.id)) })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-5 py-8 text-center text-sm text-muted-foreground",
						children: "No pending teacher requests. New registrations will appear here for review."
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-4 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "lg:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "font-display text-base",
						children: "Users"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Promote, demote, or review accounts." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "p-0",
						children: dashboard.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "m-4 h-40" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Name" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Email / Roll" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Dept" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "w-40",
								children: "Role"
							})
						] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: users.map((u) => {
							const current = u.roles.includes("admin") ? "admin" : u.roles.includes("teacher") ? "teacher" : "student";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "font-medium",
									children: u.full_name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-xs text-muted-foreground",
									children: u.roll_number ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono",
										children: u.roll_number
									}) : u.email
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-xs text-muted-foreground",
									children: u.department ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: u.verification_status && u.verification_status !== "not_applicable" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: u.verification_status === "approved" ? "default" : u.verification_status === "pending" ? "secondary" : "destructive",
									children: VERIFICATION_LABEL[u.verification_status]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: "—"
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: current,
									onValueChange: (v) => setRole(u.id, u.roles, v),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "student",
											children: "Student"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "teacher",
											children: "Teacher"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "admin",
											children: "Admin"
										})
									] })]
								}) })
							] }, u.id);
						}) })] })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "font-display text-base",
					children: "Role distribution"
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: dashboard.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48 w-full" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-56",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PieChart, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pie, {
								data: pieData,
								dataKey: "value",
								nameKey: "name",
								innerRadius: 45,
								outerRadius: 75,
								paddingAngle: 3,
								children: pieData.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: COLORS[i % COLORS.length] }, i))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
								background: "var(--popover)",
								border: "1px solid var(--border)",
								borderRadius: 8
							} }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {})
						] })
					})
				}) })] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
					className: "font-display text-base flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-4 w-4 text-primary" }), " Recent activity"]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: dashboard.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-full" }) : logs.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-border text-sm",
					children: logs.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: "mr-2",
							children: l.action
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted-foreground text-xs",
							children: [l.entity, l.entity_id ? ` • ${l.entity_id.slice(0, 8)}` : ""]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: new Date(l.created_at).toLocaleString()
						})]
					}, l.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "py-6 text-center text-sm text-muted-foreground",
					children: "No activity yet."
				}) })]
			})
		]
	});
}
function StatTile({ label, value, icon: Icon, loading }) {
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
//#endregion
export { AdminGate as component };
