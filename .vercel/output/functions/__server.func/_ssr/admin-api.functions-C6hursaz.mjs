import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { a as numberType, n as coerce, o as objectType, r as enumType, s as stringType, t as arrayType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-api.functions-C6hursaz.js
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
async function adminClient() {
	const { assertAdminToken } = await import("./admin-auth.server-tyvlUfhK.mjs");
	const { supabaseAdmin } = await import("./client.server-D1oHePJa.mjs");
	return {
		assertAdminToken,
		supabaseAdmin
	};
}
var fetchAdminDashboard_createServerFn_handler = createServerRpc({
	id: "c664209477ed7421d781473e2e872dbe9c45c2e41225424a324062e8b63e0367",
	name: "fetchAdminDashboard",
	filename: "src/functions/admin-api.functions.ts"
}, (opts) => fetchAdminDashboard.__executeServer(opts));
var fetchAdminDashboard = createServerFn({ method: "POST" }).validator(tokenOnly).handler(fetchAdminDashboard_createServerFn_handler, async ({ data }) => {
	const { assertAdminToken, supabaseAdmin } = await adminClient();
	assertAdminToken(data.token);
	const [students, teachers, admins, notices, resources, events, profiles, roles, pending, logs] = await Promise.all([
		supabaseAdmin.from("user_roles").select("*", {
			count: "exact",
			head: true
		}).eq("role", "student"),
		supabaseAdmin.from("user_roles").select("*", {
			count: "exact",
			head: true
		}).eq("role", "teacher"),
		supabaseAdmin.from("user_roles").select("*", {
			count: "exact",
			head: true
		}).eq("role", "admin"),
		supabaseAdmin.from("notices").select("*", {
			count: "exact",
			head: true
		}),
		supabaseAdmin.from("resources").select("*", {
			count: "exact",
			head: true
		}),
		supabaseAdmin.from("events").select("*", {
			count: "exact",
			head: true
		}),
		supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
		supabaseAdmin.from("user_roles").select("user_id,role"),
		supabaseAdmin.from("profiles").select("*").eq("verification_status", "pending").order("created_at", { ascending: true }),
		supabaseAdmin.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(50)
	]);
	const byUser = /* @__PURE__ */ new Map();
	(roles.data ?? []).forEach((r) => {
		const arr = byUser.get(r.user_id) ?? [];
		arr.push(r.role);
		byUser.set(r.user_id, arr);
	});
	return {
		stats: {
			students: students.count ?? 0,
			teachers: teachers.count ?? 0,
			admins: admins.count ?? 0,
			notices: notices.count ?? 0,
			resources: resources.count ?? 0,
			events: events.count ?? 0
		},
		users: (profiles.data ?? []).map((p) => ({
			...p,
			roles: byUser.get(p.id) ?? []
		})),
		pendingTeachers: pending.data ?? [],
		logs: logs.data ?? []
	};
});
var adminApproveTeacher_createServerFn_handler = createServerRpc({
	id: "aa43677ae01abaef43705634754a0d41438c6318198a6fc9b26560d4437693d5",
	name: "adminApproveTeacher",
	filename: "src/functions/admin-api.functions.ts"
}, (opts) => adminApproveTeacher.__executeServer(opts));
var adminApproveTeacher = createServerFn({ method: "POST" }).validator(approveSchema).handler(adminApproveTeacher_createServerFn_handler, async ({ data }) => {
	const { assertAdminToken, supabaseAdmin } = await adminClient();
	assertAdminToken(data.token);
	const { error: profileErr } = await supabaseAdmin.from("profiles").update({ verification_status: "approved" }).eq("id", data.userId);
	if (profileErr) throw new Error(profileErr.message);
	const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({
		user_id: data.userId,
		role: "teacher"
	});
	if (roleErr) throw new Error(roleErr.message);
	await supabaseAdmin.from("activity_logs").insert({
		action: "teacher_approved",
		entity: "profiles",
		entity_id: data.userId,
		metadata: {
			full_name: data.fullName,
			via: "env_admin"
		}
	});
});
var adminRejectTeacher_createServerFn_handler = createServerRpc({
	id: "828c9b6436ea019fd107cccecb9ff63e07a29131f42fdf1255da0724f373f1f3",
	name: "adminRejectTeacher",
	filename: "src/functions/admin-api.functions.ts"
}, (opts) => adminRejectTeacher.__executeServer(opts));
var adminRejectTeacher = createServerFn({ method: "POST" }).validator(rejectSchema).handler(adminRejectTeacher_createServerFn_handler, async ({ data }) => {
	const { assertAdminToken, supabaseAdmin } = await adminClient();
	assertAdminToken(data.token);
	const { error } = await supabaseAdmin.from("profiles").update({ verification_status: "rejected" }).eq("id", data.userId);
	if (error) throw new Error(error.message);
	await supabaseAdmin.from("activity_logs").insert({
		action: "teacher_rejected",
		entity: "profiles",
		entity_id: data.userId,
		metadata: {
			full_name: data.fullName,
			via: "env_admin"
		}
	});
});
var adminSetUserRole_createServerFn_handler = createServerRpc({
	id: "40467fa194e16826a5416dfe58a994f06315cee58c928f1a80f231a639f9a781",
	name: "adminSetUserRole",
	filename: "src/functions/admin-api.functions.ts"
}, (opts) => adminSetUserRole.__executeServer(opts));
var adminSetUserRole = createServerFn({ method: "POST" }).validator(setRoleSchema).handler(adminSetUserRole_createServerFn_handler, async ({ data }) => {
	const { assertAdminToken, supabaseAdmin } = await adminClient();
	assertAdminToken(data.token);
	const { error: delErr } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
	if (delErr) throw new Error(delErr.message);
	const { error } = await supabaseAdmin.from("user_roles").insert({
		user_id: data.userId,
		role: data.nextRole
	});
	if (error) throw new Error(error.message);
	await supabaseAdmin.from("activity_logs").insert({
		action: "role_change",
		entity: "user_roles",
		entity_id: data.userId,
		metadata: {
			from: data.currentRoles,
			to: data.nextRole,
			via: "env_admin"
		}
	});
});
var noticeListSchema = objectType({
	token: stringType().min(1),
	search: stringType().optional(),
	priority: enumType([
		"all",
		"low",
		"medium",
		"high"
	]).optional(),
	page: numberType().int().min(1).default(1),
	pageSize: numberType().int().min(1).max(50).default(8)
});
var noticeCreateSchema = objectType({
	token: stringType().min(1),
	title: stringType().trim().min(3).max(200),
	description: stringType().trim().min(3).max(5e3),
	priority: enumType([
		"low",
		"medium",
		"high"
	]),
	attachmentBase64: stringType().optional(),
	attachmentName: stringType().optional()
});
var noticeDeleteSchema = objectType({
	token: stringType().min(1),
	id: stringType().uuid(),
	attachmentUrl: stringType().nullable().optional()
});
var resourceListSchema = objectType({
	token: stringType().min(1),
	search: stringType().optional(),
	type: enumType([
		"all",
		"notes",
		"pyq",
		"lab_manual"
	]).optional(),
	semester: stringType().optional()
});
var resourceCreateSchema = objectType({
	token: stringType().min(1),
	title: stringType().trim().min(3).max(200),
	subject: stringType().trim().min(1).max(100),
	semester: coerce.number().int().min(1).max(12),
	type: enumType([
		"notes",
		"pyq",
		"lab_manual"
	]),
	description: stringType().trim().max(2e3).optional().nullable(),
	fileBase64: stringType().min(1),
	fileName: stringType().min(1).max(255)
});
var resourceDeleteSchema = objectType({
	token: stringType().min(1),
	id: stringType().uuid(),
	fileUrl: stringType()
});
function decodeBase64(base64) {
	const binary = Buffer.from(base64, "base64");
	return new Uint8Array(binary);
}
var adminFetchNotices_createServerFn_handler = createServerRpc({
	id: "f6009bd3e305f33c9950d9de6004398420f76aecfa0ebd68bc1a306c9b979956",
	name: "adminFetchNotices",
	filename: "src/functions/admin-api.functions.ts"
}, (opts) => adminFetchNotices.__executeServer(opts));
var adminFetchNotices = createServerFn({ method: "POST" }).validator(noticeListSchema).handler(adminFetchNotices_createServerFn_handler, async ({ data }) => {
	const { assertAdminToken, supabaseAdmin } = await adminClient();
	assertAdminToken(data.token);
	const from = (data.page - 1) * data.pageSize;
	let q = supabaseAdmin.from("notices").select("*", { count: "exact" }).order("created_at", { ascending: false });
	if (data.search?.trim()) q = q.or(`title.ilike.%${data.search.trim()}%,description.ilike.%${data.search.trim()}%`);
	if (data.priority && data.priority !== "all") q = q.eq("priority", data.priority);
	const { data: rows, count, error } = await q.range(from, from + data.pageSize - 1);
	if (error) throw new Error(error.message);
	return {
		rows: rows ?? [],
		total: count ?? 0
	};
});
var adminCreateNotice_createServerFn_handler = createServerRpc({
	id: "5f761717a333c8dcfaeba15b86b0c65873012225d07e652b28ec626c246313ba",
	name: "adminCreateNotice",
	filename: "src/functions/admin-api.functions.ts"
}, (opts) => adminCreateNotice.__executeServer(opts));
var adminCreateNotice = createServerFn({ method: "POST" }).validator(noticeCreateSchema).handler(adminCreateNotice_createServerFn_handler, async ({ data }) => {
	const { assertAdminToken, supabaseAdmin } = await adminClient();
	assertAdminToken(data.token);
	let attachment_url = null;
	let attachment_name = null;
	if (data.attachmentBase64 && data.attachmentName) {
		const path = `admin/${Date.now()}-${data.attachmentName}`;
		const { error: upErr } = await supabaseAdmin.storage.from("notice-attachments").upload(path, decodeBase64(data.attachmentBase64), { contentType: "application/octet-stream" });
		if (upErr) throw new Error(upErr.message);
		attachment_url = path;
		attachment_name = data.attachmentName;
	}
	const { error } = await supabaseAdmin.from("notices").insert({
		title: data.title,
		description: data.description,
		priority: data.priority,
		attachment_url,
		attachment_name,
		posted_by: null
	});
	if (error) throw new Error(error.message);
	await supabaseAdmin.from("activity_logs").insert({
		action: "notice_created",
		entity: "notices",
		metadata: {
			title: data.title,
			via: "env_admin"
		}
	});
});
var adminDeleteNotice_createServerFn_handler = createServerRpc({
	id: "b96827a6d10d4de5c307f005f628ecc0339459ccef43589e028db7ef22f512b9",
	name: "adminDeleteNotice",
	filename: "src/functions/admin-api.functions.ts"
}, (opts) => adminDeleteNotice.__executeServer(opts));
var adminDeleteNotice = createServerFn({ method: "POST" }).validator(noticeDeleteSchema).handler(adminDeleteNotice_createServerFn_handler, async ({ data }) => {
	const { assertAdminToken, supabaseAdmin } = await adminClient();
	assertAdminToken(data.token);
	if (data.attachmentUrl) await supabaseAdmin.storage.from("notice-attachments").remove([data.attachmentUrl]);
	const { error } = await supabaseAdmin.from("notices").delete().eq("id", data.id);
	if (error) throw new Error(error.message);
});
var adminFetchResources_createServerFn_handler = createServerRpc({
	id: "65ea9da53c270f74e6d41151f2f1279ca143d13532d62936dddfa9e0a5d5332e",
	name: "adminFetchResources",
	filename: "src/functions/admin-api.functions.ts"
}, (opts) => adminFetchResources.__executeServer(opts));
var adminFetchResources = createServerFn({ method: "POST" }).validator(resourceListSchema).handler(adminFetchResources_createServerFn_handler, async ({ data }) => {
	const { assertAdminToken, supabaseAdmin } = await adminClient();
	assertAdminToken(data.token);
	let q = supabaseAdmin.from("resources").select("*").order("created_at", { ascending: false });
	if (data.search?.trim()) q = q.or(`title.ilike.%${data.search.trim()}%,subject.ilike.%${data.search.trim()}%`);
	if (data.type && data.type !== "all") q = q.eq("type", data.type);
	if (data.semester && data.semester !== "all") q = q.eq("semester", Number(data.semester));
	const { data: rows, error } = await q;
	if (error) throw new Error(error.message);
	return rows ?? [];
});
var adminCreateResource_createServerFn_handler = createServerRpc({
	id: "9342624d49bab7b169a115f438cafdeaa15b0eec68b4ae9feed115e54c2787d8",
	name: "adminCreateResource",
	filename: "src/functions/admin-api.functions.ts"
}, (opts) => adminCreateResource.__executeServer(opts));
var adminCreateResource = createServerFn({ method: "POST" }).validator(resourceCreateSchema).handler(adminCreateResource_createServerFn_handler, async ({ data }) => {
	const { assertAdminToken, supabaseAdmin } = await adminClient();
	assertAdminToken(data.token);
	const path = `admin/${Date.now()}-${data.fileName}`;
	const { error: upErr } = await supabaseAdmin.storage.from("resources").upload(path, decodeBase64(data.fileBase64), { contentType: "application/octet-stream" });
	if (upErr) throw new Error(upErr.message);
	const { error } = await supabaseAdmin.from("resources").insert({
		title: data.title,
		subject: data.subject,
		semester: data.semester,
		type: data.type,
		description: data.description ?? null,
		file_url: path,
		file_name: data.fileName,
		uploaded_by: null
	});
	if (error) throw new Error(error.message);
	await supabaseAdmin.from("activity_logs").insert({
		action: "resource_created",
		entity: "resources",
		metadata: {
			title: data.title,
			via: "env_admin"
		}
	});
});
var adminDeleteResource_createServerFn_handler = createServerRpc({
	id: "816607576a27a2755a178a9f7adc919e58f4a2730bd270d02cadca03bc4e2fe1",
	name: "adminDeleteResource",
	filename: "src/functions/admin-api.functions.ts"
}, (opts) => adminDeleteResource.__executeServer(opts));
var adminDeleteResource = createServerFn({ method: "POST" }).validator(resourceDeleteSchema).handler(adminDeleteResource_createServerFn_handler, async ({ data }) => {
	const { assertAdminToken, supabaseAdmin } = await adminClient();
	assertAdminToken(data.token);
	await supabaseAdmin.storage.from("resources").remove([data.fileUrl]);
	const { error } = await supabaseAdmin.from("resources").delete().eq("id", data.id);
	if (error) throw new Error(error.message);
});
var adminGetSignedUrl_createServerFn_handler = createServerRpc({
	id: "bfcf3ca10844174dc68c474f60b6a252b66e57a564b0ea919d9224ab52e724dd",
	name: "adminGetSignedUrl",
	filename: "src/functions/admin-api.functions.ts"
}, (opts) => adminGetSignedUrl.__executeServer(opts));
var adminGetSignedUrl = createServerFn({ method: "POST" }).validator(objectType({
	token: stringType().min(1),
	bucket: enumType(["notice-attachments", "resources"]),
	path: stringType().min(1)
})).handler(adminGetSignedUrl_createServerFn_handler, async ({ data }) => {
	const { assertAdminToken, supabaseAdmin } = await adminClient();
	assertAdminToken(data.token);
	const { data: signed, error } = await supabaseAdmin.storage.from(data.bucket).createSignedUrl(data.path, 60);
	if (error) throw new Error(error.message);
	return signed.signedUrl;
});
//#endregion
export { adminApproveTeacher_createServerFn_handler, adminCreateNotice_createServerFn_handler, adminCreateResource_createServerFn_handler, adminDeleteNotice_createServerFn_handler, adminDeleteResource_createServerFn_handler, adminFetchNotices_createServerFn_handler, adminFetchResources_createServerFn_handler, adminGetSignedUrl_createServerFn_handler, adminRejectTeacher_createServerFn_handler, adminSetUserRole_createServerFn_handler, fetchAdminDashboard_createServerFn_handler };
