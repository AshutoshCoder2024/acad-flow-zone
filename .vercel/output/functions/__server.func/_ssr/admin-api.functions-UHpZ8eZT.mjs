import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { a as numberType, n as coerce, o as objectType, r as enumType, s as stringType, t as arrayType } from "../_libs/zod.mjs";
import { r as createSsrRpc } from "./use-auth-eL2T4SAm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-api.functions-UHpZ8eZT.js
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
var adminFetchNotices = createServerFn({ method: "POST" }).validator(noticeListSchema).handler(createSsrRpc("f6009bd3e305f33c9950d9de6004398420f76aecfa0ebd68bc1a306c9b979956"));
var adminCreateNotice = createServerFn({ method: "POST" }).validator(noticeCreateSchema).handler(createSsrRpc("5f761717a333c8dcfaeba15b86b0c65873012225d07e652b28ec626c246313ba"));
var adminDeleteNotice = createServerFn({ method: "POST" }).validator(noticeDeleteSchema).handler(createSsrRpc("b96827a6d10d4de5c307f005f628ecc0339459ccef43589e028db7ef22f512b9"));
var adminFetchResources = createServerFn({ method: "POST" }).validator(resourceListSchema).handler(createSsrRpc("65ea9da53c270f74e6d41151f2f1279ca143d13532d62936dddfa9e0a5d5332e"));
var adminCreateResource = createServerFn({ method: "POST" }).validator(resourceCreateSchema).handler(createSsrRpc("9342624d49bab7b169a115f438cafdeaa15b0eec68b4ae9feed115e54c2787d8"));
var adminDeleteResource = createServerFn({ method: "POST" }).validator(resourceDeleteSchema).handler(createSsrRpc("816607576a27a2755a178a9f7adc919e58f4a2730bd270d02cadca03bc4e2fe1"));
var adminGetSignedUrl = createServerFn({ method: "POST" }).validator(objectType({
	token: stringType().min(1),
	bucket: enumType(["notice-attachments", "resources"]),
	path: stringType().min(1)
})).handler(createSsrRpc("bfcf3ca10844174dc68c474f60b6a252b66e57a564b0ea919d9224ab52e724dd"));
//#endregion
export { adminDeleteResource as a, adminGetSignedUrl as c, fetchAdminDashboard as d, adminDeleteNotice as i, adminRejectTeacher as l, adminCreateNotice as n, adminFetchNotices as o, adminCreateResource as r, adminFetchResources as s, adminApproveTeacher as t, adminSetUserRole as u };
