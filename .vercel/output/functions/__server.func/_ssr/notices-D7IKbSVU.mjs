import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BbVyVwjV.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { a as objectType, o as stringType, r as enumType } from "../_libs/zod.mjs";
import { s as useAuth } from "./use-auth-11PuUOat.mjs";
import { n as buttonVariants, r as cn, t as Button } from "./button-PwNqyxv_.mjs";
import { n as CardContent, o as Input, t as Card } from "./card-D3q4owDA.mjs";
import { D as ChevronRight, O as ChevronLeft, c as Search, d as Plus, f as Paperclip, g as LoaderCircle, i as Trash2, x as Ellipsis } from "../_libs/lucide-react.mjs";
import { i as Skeleton, t as AppShell } from "./AppShell-Bqd-FLq8.mjs";
import { t as Badge } from "./badge-B3f60TId.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DamjaduW.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-BeT0bXvu.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, s as DialogTrigger, t as Dialog } from "./dialog-BvYONHWJ.mjs";
import { t as Textarea } from "./textarea-DjqHhWkA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notices-D7IKbSVU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Pagination = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
	role: "navigation",
	"aria-label": "pagination",
	className: cn("mx-auto flex w-full justify-center", className),
	...props
});
Pagination.displayName = "Pagination";
var PaginationContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
	ref,
	className: cn("flex flex-row items-center gap-1", className),
	...props
}));
PaginationContent.displayName = "PaginationContent";
var PaginationItem = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
	ref,
	className: cn("", className),
	...props
}));
PaginationItem.displayName = "PaginationItem";
var PaginationLink = ({ className, isActive, size = "icon", ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
	"aria-current": isActive ? "page" : void 0,
	className: cn(buttonVariants({
		variant: isActive ? "outline" : "ghost",
		size
	}), className),
	...props
});
PaginationLink.displayName = "PaginationLink";
var PaginationPrevious = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PaginationLink, {
	"aria-label": "Go to previous page",
	size: "default",
	className: cn("gap-1 pl-2.5", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Previous" })]
});
PaginationPrevious.displayName = "PaginationPrevious";
var PaginationNext = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PaginationLink, {
	"aria-label": "Go to next page",
	size: "default",
	className: cn("gap-1 pr-2.5", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Next" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })]
});
PaginationNext.displayName = "PaginationNext";
var PaginationEllipsis = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
	"aria-hidden": true,
	className: cn("flex h-9 w-9 items-center justify-center", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "sr-only",
		children: "More pages"
	})]
});
PaginationEllipsis.displayName = "PaginationEllipsis";
var PAGE_SIZE = 8;
var noticeSchema = objectType({
	title: stringType().trim().min(3).max(200),
	description: stringType().trim().min(3).max(5e3),
	priority: enumType([
		"low",
		"medium",
		"high"
	])
});
function NoticesPage() {
	const { role, user } = useAuth();
	const canPost = role === "teacher" || role === "admin";
	const qc = useQueryClient();
	const [search, setSearch] = (0, import_react.useState)("");
	const [priority, setPriority] = (0, import_react.useState)("all");
	const [page, setPage] = (0, import_react.useState)(1);
	const [open, setOpen] = (0, import_react.useState)(false);
	const query = useQuery({
		queryKey: ["notices", {
			search,
			priority,
			page
		}],
		queryFn: async () => {
			let q = supabase.from("notices").select("*", { count: "exact" }).order("created_at", { ascending: false });
			if (search.trim()) q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
			if (priority !== "all") q = q.eq("priority", priority);
			const from = (page - 1) * PAGE_SIZE;
			q = q.range(from, from + PAGE_SIZE - 1);
			const { data, count, error } = await q;
			if (error) throw error;
			return {
				rows: data ?? [],
				total: count ?? 0
			};
		}
	});
	const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE_SIZE));
	async function handleCreate(form, file) {
		if (!user) return;
		const parsed = noticeSchema.safeParse({
			title: form.get("title"),
			description: form.get("description"),
			priority: form.get("priority")
		});
		if (!parsed.success) return toast.error(parsed.error.issues[0].message);
		let attachment_url = null;
		let attachment_name = null;
		if (file) {
			const path = `${user.id}/${Date.now()}-${file.name}`;
			const { error: upErr } = await supabase.storage.from("notice-attachments").upload(path, file);
			if (upErr) return toast.error(upErr.message);
			attachment_url = path;
			attachment_name = file.name;
		}
		const { error } = await supabase.from("notices").insert({
			...parsed.data,
			attachment_url,
			attachment_name,
			posted_by: user.id
		});
		if (error) return toast.error(error.message);
		toast.success("Notice posted");
		setOpen(false);
		qc.invalidateQueries({ queryKey: ["notices"] });
		qc.invalidateQueries({ queryKey: ["recent-notices"] });
		qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
	}
	async function handleDelete(id) {
		if (!confirm("Delete this notice?")) return;
		const { error } = await supabase.from("notices").delete().eq("id", id);
		if (error) return toast.error(error.message);
		toast.success("Deleted");
		qc.invalidateQueries({ queryKey: ["notices"] });
	}
	async function downloadAttachment(path, name) {
		const { data, error } = await supabase.storage.from("notice-attachments").createSignedUrl(path, 60);
		if (error) return toast.error(error.message);
		const a = document.createElement("a");
		a.href = data.signedUrl;
		a.download = name;
		a.click();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Notices",
		subtitle: "Pinned by priority. Stay informed.",
		actions: canPost && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
			open,
			onOpenChange: setOpen,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " New notice"]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Post a new notice" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Visible to all users." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoticeForm, { onSubmit: handleCreate })] })]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex flex-col gap-3 sm:flex-row sm:items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: search,
						onChange: (e) => {
							setSearch(e.target.value);
							setPage(1);
						},
						placeholder: "Search notices...",
						className: "pl-9"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: priority,
					onValueChange: (v) => {
						setPriority(v);
						setPage(1);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						className: "w-full sm:w-44",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "All priorities"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "high",
							children: "High"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "medium",
							children: "Medium"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "low",
							children: "Low"
						})
					] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3",
				children: query.isLoading ? Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-full" }, i)) : query.data?.rows.length ? query.data.rows.map((n) => {
					const canDelete = role === "admin" || n.posted_by === user?.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						className: "surface-glow transition-shadow hover:shadow-md",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
							className: "p-5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mb-1 flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "font-display text-base font-semibold",
												children: n.title
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PriorityBadge, { p: n.priority })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted-foreground whitespace-pre-wrap",
											children: n.description
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: new Date(n.created_at).toLocaleString() }), n.attachment_url && n.attachment_name && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												onClick: () => downloadAttachment(n.attachment_url, n.attachment_name),
												className: "inline-flex items-center gap-1 text-primary hover:underline",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Paperclip, { className: "h-3 w-3" }),
													" ",
													n.attachment_name
												]
											})]
										})
									]
								}), canDelete && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									onClick: () => handleDelete(n.id),
									"aria-label": "Delete",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4 text-destructive" })
								})]
							})
						})
					}, n.id);
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "py-12 text-center text-sm text-muted-foreground",
					children: "No notices found."
				}) })
			}),
			totalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pagination, {
				className: "mt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PaginationContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationPrevious, { onClick: () => setPage((p) => Math.max(1, p - 1)) }) }),
					Array.from({ length: totalPages }).slice(0, 6).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationLink, {
						isActive: page === i + 1,
						onClick: () => setPage(i + 1),
						children: i + 1
					}) }, i)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationNext, { onClick: () => setPage((p) => Math.min(totalPages, p + 1)) }) })
				] })
			})
		]
	});
}
function NoticeForm({ onSubmit }) {
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
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "title",
					children: "Title"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "title",
					name: "title",
					required: true
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "description",
					children: "Description"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					id: "description",
					name: "description",
					rows: 5,
					required: true
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Priority" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					name: "priority",
					defaultValue: "medium",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "low",
							children: "Low"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "medium",
							children: "Medium"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "high",
							children: "High"
						})
					] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "file",
					children: "Attachment (optional)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "file",
					type: "file",
					onChange: (e) => setFile(e.target.files?.[0] ?? null)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "submit",
				disabled: submitting,
				children: [submitting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), " Post notice"]
			}) })
		]
	});
}
function PriorityBadge({ p }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: {
			high: "destructive",
			medium: "default",
			low: "secondary"
		}[p] ?? "secondary",
		className: "capitalize",
		children: p
	});
}
//#endregion
export { NoticesPage as component };
