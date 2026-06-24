import { i as __toESM } from "../_runtime.mjs";
import { t as ROLE_LABEL } from "./auth-helpers-BucyYuvz.mjs";
import { t as supabase } from "./client-BbVyVwjV.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { i as literalType, n as coerce, o as objectType, s as stringType } from "../_libs/zod.mjs";
import { i as useAuth } from "./use-auth-eL2T4SAm.mjs";
import { t as Button } from "./button-PwNqyxv_.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, o as Input, t as Card } from "./card-D3q4owDA.mjs";
import { g as LoaderCircle, l as Save } from "../_libs/lucide-react.mjs";
import { n as Avatar, r as AvatarFallback, t as AppShell } from "./AppShell-Di7ONok9.mjs";
import { t as Badge } from "./badge-B3f60TId.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-BeT0bXvu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-MoF6i_hj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var schema = objectType({
	full_name: stringType().trim().min(2).max(100),
	department: stringType().trim().max(100).optional(),
	semester: coerce.number().int().min(1).max(12).optional().or(literalType(""))
});
function ProfilePage() {
	const { profile, role, refresh } = useAuth();
	const [saving, setSaving] = (0, import_react.useState)(false);
	if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Profile",
		children: "Loading..."
	});
	const initials = (profile.full_name || profile.email).split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
	async function handle(form) {
		const parsed = schema.safeParse({
			full_name: form.get("full_name"),
			department: form.get("department") || void 0,
			semester: form.get("semester") || void 0
		});
		if (!parsed.success) return toast.error(parsed.error.issues[0].message);
		setSaving(true);
		const { error } = await supabase.from("profiles").update({
			full_name: parsed.data.full_name,
			department: parsed.data.department || null,
			semester: parsed.data.semester ? Number(parsed.data.semester) : null
		}).eq("id", profile.id);
		setSaving(false);
		if (error) return toast.error(error.message);
		toast.success("Profile updated");
		await refresh();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Profile",
		subtitle: "Your account details.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 lg:grid-cols-[280px_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "surface-glow",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "flex flex-col items-center p-6 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar, {
							className: "h-20 w-20",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
								className: "bg-primary/15 text-primary text-2xl font-semibold",
								children: initials
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-3 font-display text-lg font-semibold",
							children: profile.full_name || "Unnamed"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							className: "mt-1",
							variant: "outline",
							children: ROLE_LABEL[role]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-xs text-muted-foreground break-all",
							children: profile.email
						}),
						profile.roll_number && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-mono text-xs text-muted-foreground",
							children: profile.roll_number
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "font-display text-base",
				children: "Edit profile"
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-3",
				onSubmit: (e) => {
					e.preventDefault();
					handle(new FormData(e.currentTarget));
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "full_name",
							children: "Full name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "full_name",
							name: "full_name",
							defaultValue: profile.full_name
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "department",
								children: "Department"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "department",
								name: "department",
								defaultValue: profile.department ?? ""
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "semester",
								children: "Semester"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "semester",
								name: "semester",
								type: "number",
								min: 1,
								max: 12,
								defaultValue: profile.semester ?? ""
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "submit",
						disabled: saving,
						children: [saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "mr-2 h-4 w-4" }), "Save changes"]
					})
				]
			}) })] })]
		})
	});
}
//#endregion
export { ProfilePage as component };
