import { i as __toESM } from "../_runtime.mjs";
import { g as Link, v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-BbVyVwjV.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { a as objectType, n as coerce, o as stringType, r as enumType } from "../_libs/zod.mjs";
import { i as adminLogin, o as rollToEmail, s as useAuth } from "./use-auth-11PuUOat.mjs";
import { t as Button } from "./button-PwNqyxv_.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, o as Input, r as CardDescription, t as Card } from "./card-D3q4owDA.mjs";
import { g as LoaderCircle, v as GraduationCap } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DamjaduW.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-BeT0bXvu.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-CA_Ke5Cp.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-Cj46OBqE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var signinStudentSchema = objectType({
	roll: stringType().trim().min(2, "Roll number required").max(40),
	password: stringType().min(6, "Min 6 characters").max(128)
});
var signinTeacherSchema = objectType({
	email: stringType().trim().email().max(255),
	password: stringType().min(6).max(128)
});
var signinAdminSchema = objectType({
	username: stringType().trim().min(1, "Username required").max(100),
	password: stringType().min(1, "Password required").max(128)
});
var signupSchema = objectType({
	role: enumType(["student", "teacher"]),
	full_name: stringType().trim().min(2).max(100),
	email: stringType().trim().email().max(255).optional(),
	roll: stringType().trim().min(2).max(40).optional(),
	department: stringType().trim().min(1, "Department required").max(100).optional(),
	semester: coerce.number().int().min(1).max(12).optional(),
	password: stringType().min(6).max(128)
});
async function blockUnverifiedTeacher(userId) {
	const { data: profile } = await supabase.from("profiles").select("verification_status").eq("id", userId).maybeSingle();
	if (profile?.verification_status === "pending") {
		await supabase.auth.signOut();
		toast.error("Your account is pending administrator approval.");
		return true;
	}
	if (profile?.verification_status === "rejected") {
		await supabase.auth.signOut();
		toast.error("Your registration request was rejected. Contact your administrator.");
		return true;
	}
	return false;
}
function AuthPage() {
	const navigate = useNavigate();
	const { refresh } = useAuth();
	const [tab, setTab] = (0, import_react.useState)("signin");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative grid min-h-screen place-items-center bg-background px-4 py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none absolute inset-0 -z-10 opacity-70",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/",
				className: "mb-6 flex items-center justify-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GraduationCap, { className: "h-5 w-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-xl font-semibold",
					children: "DeptPortal"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "border-border/80",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "font-display",
					children: "Welcome"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Sign in or create your department account." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
					value: tab,
					onValueChange: (v) => setTab(v),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
							className: "grid w-full grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "signin",
								children: "Sign in"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "signup",
								children: "Create account"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "signin",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignInForm, {
								onDone: async () => {
									await refresh();
									navigate({ to: "/dashboard" });
								},
								onAdminDone: async () => {
									await refresh();
									navigate({ to: "/admin" });
								}
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "signup",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignUpForm, {})
						})
					]
				}) })]
			})]
		})]
	});
}
function SignInForm({ onDone, onAdminDone }) {
	const { setEnvAdminSession } = useAuth();
	const [mode, setMode] = (0, import_react.useState)("student");
	const [loading, setLoading] = (0, import_react.useState)(false);
	async function handleStudent(form) {
		const parsed = signinStudentSchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) {
			toast.error(parsed.error.issues[0].message);
			return;
		}
		setLoading(true);
		const { error } = await supabase.auth.signInWithPassword({
			email: rollToEmail(parsed.data.roll),
			password: parsed.data.password
		});
		setLoading(false);
		if (error) return toast.error(error.message);
		toast.success("Signed in");
		onDone();
	}
	async function handleTeacher(form) {
		const parsed = signinTeacherSchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) {
			toast.error(parsed.error.issues[0].message);
			return;
		}
		setLoading(true);
		const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
		if (error) {
			setLoading(false);
			return toast.error(error.message);
		}
		if (data.user && await blockUnverifiedTeacher(data.user.id)) {
			setLoading(false);
			return;
		}
		setLoading(false);
		toast.success("Signed in");
		onDone();
	}
	async function handleAdmin(form) {
		const parsed = signinAdminSchema.safeParse(Object.fromEntries(form));
		if (!parsed.success) {
			toast.error(parsed.error.issues[0].message);
			return;
		}
		setLoading(true);
		try {
			await supabase.auth.signOut();
			setEnvAdminSession(await adminLogin({ data: parsed.data }));
			toast.success("Signed in as administrator");
			await onAdminDone();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Administrator sign-in failed");
		} finally {
			setLoading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			value: mode,
			onValueChange: (v) => setMode(v),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
					className: "grid w-full grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "student",
							children: "Student"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "teacher",
							children: "Teacher"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "admin",
							children: "Admin"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "student",
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "space-y-3",
						onSubmit: (e) => {
							e.preventDefault();
							handleStudent(new FormData(e.currentTarget));
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								name: "roll",
								label: "Roll number",
								placeholder: "e.g. 22CS101"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								name: "password",
								label: "Password",
								type: "password"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "w-full",
								disabled: loading,
								children: [loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Sign in"]
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "teacher",
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "space-y-3",
						onSubmit: (e) => {
							e.preventDefault();
							handleTeacher(new FormData(e.currentTarget));
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								name: "email",
								label: "Email",
								type: "email",
								placeholder: "you@school.edu"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								name: "password",
								label: "Password",
								type: "password"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: "Only verified teachers can sign in. New registrations require administrator approval."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "w-full",
								disabled: loading,
								children: [loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Sign in"]
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "admin",
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "space-y-3",
						onSubmit: (e) => {
							e.preventDefault();
							handleAdmin(new FormData(e.currentTarget));
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								name: "username",
								label: "Username",
								placeholder: "admin",
								autoComplete: "username"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								name: "password",
								label: "Password",
								type: "password",
								autoComplete: "current-password"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: "Sign in with the administrator username and password from your server .env file."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "w-full",
								disabled: loading,
								children: [loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Sign in as administrator"]
							})
						]
					})
				})
			]
		})
	});
}
function SignUpForm() {
	const [role, setRole] = (0, import_react.useState)("student");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [submitted, setSubmitted] = (0, import_react.useState)(false);
	async function handle(form) {
		const raw = Object.fromEntries(form);
		const parsed = signupSchema.safeParse({
			...raw,
			role: role === "teacher" ? "teacher" : "student"
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0].message);
			return;
		}
		const d = parsed.data;
		const signupRole = d.role;
		const email = signupRole === "student" ? rollToEmail(d.roll) : d.email;
		if (signupRole === "student" && !d.roll) return toast.error("Roll number required");
		if (signupRole === "teacher" && !d.email) return toast.error("Email required");
		if (signupRole === "teacher" && !d.department) return toast.error("Department required");
		setLoading(true);
		const { error } = await supabase.auth.signUp({
			email,
			password: d.password,
			options: { data: {
				role: signupRole,
				full_name: d.full_name,
				roll_number: d.roll ?? null,
				department: d.department ?? null,
				semester: d.semester ?? null
			} }
		});
		setLoading(false);
		if (error) return toast.error(error.message);
		await supabase.auth.signOut();
		if (signupRole === "teacher") {
			setSubmitted(true);
			toast.success("Registration submitted for review");
			return;
		}
		toast.success("Account created — you can sign in now");
		setSubmitted(true);
	}
	if (submitted && role === "teacher") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 space-y-3 rounded-lg border border-border/80 bg-muted/30 p-4 text-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium",
				children: "Registration submitted"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted-foreground",
				children: "Your teacher account is pending administrator approval. You will be able to sign in once your request has been reviewed."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				className: "w-full",
				onClick: () => setSubmitted(false),
				children: "Back to sign in"
			})
		]
	});
	if (submitted && role === "student") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 space-y-3 rounded-lg border border-border/80 bg-muted/30 p-4 text-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium",
				children: "Account created"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted-foreground",
				children: "You can now sign in with your roll number and password."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				className: "w-full",
				onClick: () => setSubmitted(false),
				children: "Go to sign in"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "mt-4 space-y-3",
		onSubmit: (e) => {
			e.preventDefault();
			handle(new FormData(e.currentTarget));
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Role" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: role,
					onValueChange: (v) => setRole(v),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "student",
						children: "Student"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "teacher",
						children: "Teacher"
					})] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "full_name",
				label: "Full name",
				placeholder: "Jane Doe"
			}),
			role === "student" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "roll",
				label: "Roll number",
				placeholder: "22CS101"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					name: "department",
					label: "Department",
					placeholder: "CSE"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					name: "semester",
					label: "Semester",
					type: "number",
					placeholder: "5"
				})]
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					name: "email",
					label: "Email",
					type: "email",
					placeholder: "you@school.edu"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					name: "department",
					label: "Department",
					placeholder: "CSE",
					required: true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: "Teacher accounts require administrator approval before you can sign in."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "password",
				label: "Password",
				type: "password",
				placeholder: "Min 6 chars"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "w-full",
				disabled: loading,
				children: [loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), role === "teacher" ? "Submit registration" : "Create account"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-xs text-muted-foreground",
				children: "By signing up you agree to your department's acceptable-use policy."
			})
		]
	});
}
function Field({ name, label, type = "text", placeholder, autoComplete, required }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor: name,
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			id: name,
			name,
			type,
			placeholder,
			autoComplete: autoComplete ?? "off",
			required
		})]
	});
}
//#endregion
export { AuthPage as component };
