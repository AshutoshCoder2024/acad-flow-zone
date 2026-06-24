import { i as __toESM } from "../_runtime.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-BbVyVwjV.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { i as useAuth } from "./use-auth-eL2T4SAm.mjs";
import { t as Button } from "./button-PwNqyxv_.mjs";
import { n as CardContent, o as Input, t as Card } from "./card-D3q4owDA.mjs";
import { I as ArrowLeft, d as Plus, g as LoaderCircle, i as Trash2 } from "../_libs/lucide-react.mjs";
import { i as Skeleton, t as AppShell } from "./AppShell-Di7ONok9.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-BeT0bXvu.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, s as DialogTrigger, t as Dialog } from "./dialog-BvYONHWJ.mjs";
import { t as Route } from "./events._id-CNM05izn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/events._id-Bt82iPq_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function EventDetail() {
	const { id } = Route.useParams();
	const { role, user } = useAuth();
	const canUpload = role === "teacher" || role === "admin";
	const qc = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [signedMap, setSignedMap] = (0, import_react.useState)({});
	const event = useQuery({
		queryKey: ["event", id],
		queryFn: async () => {
			const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
			if (error) throw error;
			return data;
		}
	});
	const gallery = useQuery({
		queryKey: ["event-gallery", id],
		queryFn: async () => {
			const { data, error } = await supabase.from("gallery").select("*").eq("event_id", id).order("created_at", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
	(0, import_react.useEffect)(() => {
		(async () => {
			if (!gallery.data?.length) return;
			const paths = gallery.data.map((g) => g.image_url);
			const { data } = await supabase.storage.from("gallery").createSignedUrls(paths, 600);
			const m = {};
			data?.forEach((d, i) => {
				if (d.signedUrl) m[paths[i]] = d.signedUrl;
			});
			setSignedMap(m);
		})();
	}, [gallery.data]);
	async function handleUpload(file, caption) {
		if (!user) return;
		const path = `${id}/${Date.now()}-${file.name}`;
		const { error: upErr } = await supabase.storage.from("gallery").upload(path, file);
		if (upErr) return toast.error(upErr.message);
		const { error } = await supabase.from("gallery").insert({
			event_id: id,
			image_url: path,
			caption: caption || null,
			uploaded_by: user.id
		});
		if (error) return toast.error(error.message);
		toast.success("Uploaded");
		setOpen(false);
		qc.invalidateQueries({ queryKey: ["event-gallery", id] });
	}
	async function handleDelete(galleryId, path) {
		if (!confirm("Remove this image?")) return;
		await supabase.storage.from("gallery").remove([path]);
		const { error } = await supabase.from("gallery").delete().eq("id", galleryId);
		if (error) return toast.error(error.message);
		toast.success("Removed");
		qc.invalidateQueries({ queryKey: ["event-gallery", id] });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: event.data?.title ?? "Event",
		subtitle: event.data ? new Date(event.data.event_date).toLocaleString() : "",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "outline",
				size: "sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/events",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-1 h-4 w-4" }), " Back"]
				})
			}), canUpload && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
				open,
				onOpenChange: setOpen,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " Photo"]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Add gallery photo" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UploadForm, { onSubmit: handleUpload })] })]
			})]
		}),
		children: [
			event.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-full" }) : event.data && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "mb-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "p-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground whitespace-pre-wrap",
						children: event.data.description
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display mb-3 text-lg font-semibold",
				children: "Gallery"
			}),
			gallery.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
				children: Array.from({ length: 8 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "aspect-square w-full" }, i))
			}) : gallery.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
				children: gallery.data.map((g) => {
					const canDel = role === "admin" || g.uploaded_by === user?.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted",
						children: [
							signedMap[g.image_url] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: signedMap[g.image_url],
								alt: g.caption ?? "",
								className: "h-full w-full object-cover transition-transform group-hover:scale-105"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-full w-full" }),
							g.caption && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-xs text-white",
								children: g.caption
							}),
							canDel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "icon",
								variant: "destructive",
								className: "absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100",
								onClick: () => handleDelete(g.id, g.image_url),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3 w-3" })
							})
						]
					}, g.id);
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "py-10 text-center text-sm text-muted-foreground",
				children: "No photos yet."
			}) })
		]
	});
}
function UploadForm({ onSubmit }) {
	const [file, setFile] = (0, import_react.useState)(null);
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: async (e) => {
			e.preventDefault();
			if (!file) return toast.error("Pick an image");
			setSubmitting(true);
			await onSubmit(file, new FormData(e.currentTarget).get("caption") || "");
			setSubmitting(false);
		},
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Image" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "file",
					accept: "image/*",
					onChange: (e) => setFile(e.target.files?.[0] ?? null),
					required: true
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Caption (optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, { name: "caption" })]
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
export { EventDetail as component };
