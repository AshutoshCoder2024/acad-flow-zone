import { i as __toESM } from "../_runtime.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-BbVyVwjV.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { i as literalType, o as objectType, s as stringType } from "../_libs/zod.mjs";
import { i as useAuth } from "./use-auth-eL2T4SAm.mjs";
import { t as Button } from "./button-PwNqyxv_.mjs";
import { n as CardContent, o as Input, t as Card } from "./card-D3q4owDA.mjs";
import { N as Calendar, b as ExternalLink, d as Plus, g as LoaderCircle, i as Trash2 } from "../_libs/lucide-react.mjs";
import { i as Skeleton, t as AppShell } from "./AppShell-Di7ONok9.mjs";
import { t as Badge } from "./badge-B3f60TId.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-BeT0bXvu.mjs";
import { i as TabsTrigger, r as TabsList, t as Tabs } from "./tabs-CA_Ke5Cp.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, s as DialogTrigger, t as Dialog } from "./dialog-BvYONHWJ.mjs";
import { t as Textarea } from "./textarea-DjqHhWkA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/events-dbV_jEkM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var eventSchema = objectType({
	title: stringType().trim().min(3).max(200),
	description: stringType().trim().min(3).max(5e3),
	event_date: stringType().min(1),
	registration_link: stringType().trim().url().max(500).optional().or(literalType(""))
});
function EventsPage() {
	const { role, user } = useAuth();
	const canCreate = role === "teacher" || role === "admin";
	const qc = useQueryClient();
	const [filter, setFilter] = (0, import_react.useState)("upcoming");
	const [open, setOpen] = (0, import_react.useState)(false);
	const query = useQuery({
		queryKey: ["events", filter],
		queryFn: async () => {
			let q = supabase.from("events").select("*").order("event_date", { ascending: false });
			if (filter !== "all") q = q.eq("status", filter);
			const { data, error } = await q;
			if (error) throw error;
			return data ?? [];
		}
	});
	async function handleCreate(form) {
		if (!user) return;
		const parsed = eventSchema.safeParse({
			title: form.get("title"),
			description: form.get("description"),
			event_date: form.get("event_date"),
			registration_link: form.get("registration_link") || ""
		});
		if (!parsed.success) return toast.error(parsed.error.issues[0].message);
		const date = new Date(parsed.data.event_date);
		const { error } = await supabase.from("events").insert({
			title: parsed.data.title,
			description: parsed.data.description,
			event_date: date.toISOString(),
			registration_link: parsed.data.registration_link || null,
			status: date > /* @__PURE__ */ new Date() ? "upcoming" : "completed",
			created_by: user.id
		});
		if (error) return toast.error(error.message);
		toast.success("Event created");
		setOpen(false);
		qc.invalidateQueries({ queryKey: ["events"] });
		qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
	}
	async function handleDelete(id) {
		if (!confirm("Delete this event? Its gallery will be removed too.")) return;
		const { error } = await supabase.from("events").delete().eq("id", id);
		if (error) return toast.error(error.message);
		toast.success("Deleted");
		qc.invalidateQueries({ queryKey: ["events"] });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Events",
		subtitle: "Workshops, fests, talks — past and upcoming.",
		actions: canCreate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
			open,
			onOpenChange: setOpen,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " Event"]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Create event" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventForm, { onSubmit: handleCreate })] })]
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tabs, {
			value: filter,
			onValueChange: (v) => setFilter(v),
			className: "mb-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "upcoming",
					children: "Upcoming"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "completed",
					children: "Completed"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "all",
					children: "All"
				})
			] })
		}), query.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
			children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-56 w-full" }, i))
		}) : query.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
			children: query.data.map((e) => {
				const canDelete = role === "admin" || e.created_by === user?.id;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "surface-glow flex flex-col overflow-hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "flex flex-1 flex-col p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-2 flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: e.status === "upcoming" ? "default" : "secondary",
									className: "capitalize",
									children: e.status
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-1 text-xs text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-3 w-3" }), new Date(e.event_date).toLocaleDateString(void 0, {
										day: "numeric",
										month: "short",
										year: "numeric"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-display text-lg font-semibold leading-tight",
								children: e.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 line-clamp-3 text-sm text-muted-foreground",
								children: e.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-auto flex flex-wrap gap-2 pt-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										size: "sm",
										variant: "outline",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/events/$id",
											params: { id: e.id },
											children: "Gallery"
										})
									}),
									e.registration_link && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										size: "sm",
										variant: "default",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: e.registration_link,
											target: "_blank",
											rel: "noreferrer noopener",
											children: ["Register ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "ml-1 h-3 w-3" })]
										})
									}),
									canDelete && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "icon",
										variant: "ghost",
										className: "ml-auto",
										onClick: () => handleDelete(e.id),
										"aria-label": "Delete",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4 text-destructive" })
									})
								]
							})
						]
					})
				}, e.id);
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
			className: "py-12 text-center text-sm text-muted-foreground",
			children: "No events."
		}) })]
	});
}
function EventForm({ onSubmit }) {
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: async (e) => {
			e.preventDefault();
			setSubmitting(true);
			await onSubmit(new FormData(e.currentTarget));
			setSubmitting(false);
		},
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Title" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					name: "title",
					required: true
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Description" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					name: "description",
					rows: 4,
					required: true
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Event date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					name: "event_date",
					type: "datetime-local",
					required: true
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Registration link (optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					name: "registration_link",
					type: "url",
					placeholder: "https://..."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "submit",
				disabled: submitting,
				children: [submitting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), " Create"]
			}) })
		]
	});
}
//#endregion
export { EventsPage as component };
