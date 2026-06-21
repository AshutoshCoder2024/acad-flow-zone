import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { a as objectType, o as stringType, r as enumType, t as arrayType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-api.functions-Chai1JNK.js
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
//#endregion
export { adminApproveTeacher_createServerFn_handler, adminRejectTeacher_createServerFn_handler, adminSetUserRole_createServerFn_handler, fetchAdminDashboard_createServerFn_handler };
