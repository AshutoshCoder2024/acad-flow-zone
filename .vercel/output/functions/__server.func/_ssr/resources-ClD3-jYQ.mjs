import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BbVyVwjV.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { a as objectType, n as coerce, o as stringType, r as enumType } from "../_libs/zod.mjs";
import { s as useAuth } from "./use-auth-11PuUOat.mjs";
import { t as Button } from "./button-PwNqyxv_.mjs";
import { n as CardContent, o as Input, t as Card } from "./card-D3q4owDA.mjs";
import { S as Download, c as Search, d as Plus, g as LoaderCircle, i as Trash2, y as FileText } from "../_libs/lucide-react.mjs";
import { i as Skeleton, t as AppShell } from "./AppShell-Bqd-FLq8.mjs";
import { t as Badge } from "./badge-B3f60TId.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DamjaduW.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-BeT0bXvu.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, s as DialogTrigger, t as Dialog } from "./dialog-BvYONHWJ.mjs";
import { t as Textarea } from "./textarea-DjqHhWkA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/resources-ClD3-jYQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TYPES = [
	{
		value: "notes",
		label: "Notes"
	},
	{
		value: "pyq",
		label: "PYQ"
	},
	{
		value: "lab_manual",
		label: "Lab Manual"
	}
];
var resourceSchema = objectType({
	title: stringType().trim().min(3).max(200),
	subject: stringType().trim().min(1).max(100),
	semester: coerce.number().int().min(1).max(12),
	type: enumType([
		"notes",
		"pyq",
		"lab_manual"
	]),
	description: stringType().trim().max(2e3).optional().nullable()
});
function ResourcesPage() {
	const { role, user } = useAuth();
	const canUpload = role === "teacher" || role === "admin";
	const qc = useQueryClient();
	const [search, setSearch] = (0, import_react.useState)("");
	const [type, setType] = (0, import_react.useState)("all");
	const [semester, setSemester] = (0, import_react.useState)("all");
	const [open, setOpen] = (0, import_react.useState)(false);
	const query = useQuery({
		queryKey: ["resources", {
			search,
			type,
			semester
		}],
		queryFn: async () => {
			let q = supabase.from("resources").select("*").order("created_at", { ascending: false });
			if (search.trim()) q = q.or(`title.ilike.%${search}%,subject.ilike.%${search}%`);
			if (type !== "all") q = q.eq("type", type);
			if (semester !== "all") q = q.eq("semester", Number(semester));
			const { data, error } = await q;
			if (error) throw error;
			return data ?? [];
		}
	});
	async function handleCreate(form, file) {
		if (!user) return;
		if (!file) return toast.error("File required");
		const parsed = resourceSchema.safeParse({
			title: form.get("title"),
			subject: form.get("subject"),
			semester: form.get("semester"),
			type: form.get("type"),
			description: form.get("description") || null
		});
		if (!parsed.success) return toast.error(parsed.error.issues[0].message);
		const path = `${user.id}/${Date.now()}-${file.name}`;
		const { error: upErr } = await supabase.storage.from("resources").upload(path, file);
		if (upErr) return toast.error(upErr.message);
		const { error } = await supabase.from("resources").insert({
			...parsed.data,
			file_url: path,
			file_name: file.name,
			uploaded_by: user.id
		});
		if (error) return toast.error(error.message);
		toast.success("Resource uploaded");
		setOpen(false);
		qc.invalidateQueries({ queryKey: ["resources"] });
		qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
	}
	async function handleDelete(id, path) {
		if (!confirm("Delete this resource?")) return;
		await supabase.storage.from("resources").remove([path]);
		const { error } = await supabase.from("resources").delete().eq("id", id);
		if (error) return toast.error(error.message);
		toast.success("Deleted");
		qc.invalidateQueries({ queryKey: ["resources"] });
	}
	async function download(path, name) {
		const { data, error } = await supabase.storage.from("resources").createSignedUrl(path, 60);
		if (error) return toast.error(error.message);
		const a = document.createElement("a");
		a.href = data.signedUrl;
		a.download = name;
		a.click();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Resources & PYQ",
		subtitle: "Notes, past-year papers, and lab manuals — searchable and downloadable.",
		actions: canUpload && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
			open,
			onOpenChange: setOpen,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " Upload"]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Upload resource" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "PDF files recommended." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResourceForm, { onSubmit: handleCreate })] })]
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_180px]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: search,
						onChange: (e) => setSearch(e.target.value),
						placeholder: "Search by title or subject...",
						className: "pl-9"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: type,
					onValueChange: setType,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "all",
						children: "All types"
					}), TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: t.value,
						children: t.label
					}, t.value))] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: semester,
					onValueChange: setSemester,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "all",
						children: "All semesters"
					}), Array.from({ length: 8 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
						value: String(i + 1),
						children: ["Semester ", i + 1]
					}, i + 1))] })]
				})
			]
		}), query.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
			children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 w-full" }, i))
		}) : query.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
			children: query.data.map((r) => {
				const canDelete = role === "admin" || r.uploaded_by === user?.id;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "surface-glow flex flex-col",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "flex flex-1 flex-col p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-2 flex items-start justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-5 w-5" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: "capitalize",
									children: r.type.replace("_", " ")
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-display text-base font-semibold leading-snug",
								children: r.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: [
									r.subject,
									" • Semester ",
									r.semester
								]
							}),
							r.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted-foreground line-clamp-2",
								children: r.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-auto flex gap-2 pt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "default",
									className: "flex-1",
									onClick: () => download(r.file_url, r.file_name),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1 h-3.5 w-3.5" }), " Download"]
								}), canDelete && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "icon",
									variant: "ghost",
									onClick: () => handleDelete(r.id, r.file_url),
									"aria-label": "Delete",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4 text-destructive" })
								})]
							})
						]
					})
				}, r.id);
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
			className: "py-12 text-center text-sm text-muted-foreground",
			children: "No resources found."
		}) })]
	});
}
function ResourceForm({ onSubmit }) {
	const [file, setFile] = (0, import_react.useState)(null);
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: async (e) => {
			e.preventDefault();
			setSubmitting(true);
			await onSubmit(new FormData(e.currentTarget), file);
			setSubmitting(false);
		},
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5 col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Title" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							name: "title",
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Subject" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							name: "subject",
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Semester" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							name: "semester",
							type: "number",
							min: 1,
							max: 12,
							required: true
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					name: "type",
					defaultValue: "notes",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: t.value,
						children: t.label
					}, t.value)) })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Description (optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					name: "description",
					rows: 3
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "File" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "file",
					accept: ".pdf,.doc,.docx",
					onChange: (e) => setFile(e.target.files?.[0] ?? null),
					required: true
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "submit",
				disabled: submitting,
				children: [submitting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), " Upload"]
			}) })
		]
	});
}
//#endregion
export { ResourcesPage as component };
