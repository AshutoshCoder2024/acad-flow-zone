//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-BjFE6WQg.js
var manifest = {
	"03c9c7ffc1d7fa871964f8f6e2c23b41c19d8524845a0fafdae2cf8de722a9f2": {
		functionName: "adminLogin_createServerFn_handler",
		importer: () => import("./_ssr/admin-auth.functions-Q7pInwZ4.mjs")
	},
	"14d7cdcc4af383c66848f97dacab19f072517fa77965d4042614e87c0f1b162f": {
		functionName: "fetchSxcAttendance_createServerFn_handler",
		importer: () => import("./_ssr/attendance.functions-DTxKTAvA.mjs")
	},
	"40467fa194e16826a5416dfe58a994f06315cee58c928f1a80f231a639f9a781": {
		functionName: "adminSetUserRole_createServerFn_handler",
		importer: () => import("./_ssr/admin-api.functions-C6hursaz.mjs")
	},
	"48aae3a053da4a0a2363e4ee3f785409c97a077338f78e7c7380293f26b21bd8": {
		functionName: "registerAccount_createServerFn_handler",
		importer: () => import("./_ssr/register.functions-Cnk0iH4g.mjs")
	},
	"5f761717a333c8dcfaeba15b86b0c65873012225d07e652b28ec626c246313ba": {
		functionName: "adminCreateNotice_createServerFn_handler",
		importer: () => import("./_ssr/admin-api.functions-C6hursaz.mjs")
	},
	"65ea9da53c270f74e6d41151f2f1279ca143d13532d62936dddfa9e0a5d5332e": {
		functionName: "adminFetchResources_createServerFn_handler",
		importer: () => import("./_ssr/admin-api.functions-C6hursaz.mjs")
	},
	"816607576a27a2755a178a9f7adc919e58f4a2730bd270d02cadca03bc4e2fe1": {
		functionName: "adminDeleteResource_createServerFn_handler",
		importer: () => import("./_ssr/admin-api.functions-C6hursaz.mjs")
	},
	"828c9b6436ea019fd107cccecb9ff63e07a29131f42fdf1255da0724f373f1f3": {
		functionName: "adminRejectTeacher_createServerFn_handler",
		importer: () => import("./_ssr/admin-api.functions-C6hursaz.mjs")
	},
	"9342624d49bab7b169a115f438cafdeaa15b0eec68b4ae9feed115e54c2787d8": {
		functionName: "adminCreateResource_createServerFn_handler",
		importer: () => import("./_ssr/admin-api.functions-C6hursaz.mjs")
	},
	"aa43677ae01abaef43705634754a0d41438c6318198a6fc9b26560d4437693d5": {
		functionName: "adminApproveTeacher_createServerFn_handler",
		importer: () => import("./_ssr/admin-api.functions-C6hursaz.mjs")
	},
	"b96827a6d10d4de5c307f005f628ecc0339459ccef43589e028db7ef22f512b9": {
		functionName: "adminDeleteNotice_createServerFn_handler",
		importer: () => import("./_ssr/admin-api.functions-C6hursaz.mjs")
	},
	"bfcf3ca10844174dc68c474f60b6a252b66e57a564b0ea919d9224ab52e724dd": {
		functionName: "adminGetSignedUrl_createServerFn_handler",
		importer: () => import("./_ssr/admin-api.functions-C6hursaz.mjs")
	},
	"c664209477ed7421d781473e2e872dbe9c45c2e41225424a324062e8b63e0367": {
		functionName: "fetchAdminDashboard_createServerFn_handler",
		importer: () => import("./_ssr/admin-api.functions-C6hursaz.mjs")
	},
	"f6009bd3e305f33c9950d9de6004398420f76aecfa0ebd68bc1a306c9b979956": {
		functionName: "adminFetchNotices_createServerFn_handler",
		importer: () => import("./_ssr/admin-api.functions-C6hursaz.mjs")
	},
	"f70b5f7c47f67605d7c0ed6abb2a723a6190b36209f60cd3087bb7ea7ebbc630": {
		functionName: "validateAdminSession_createServerFn_handler",
		importer: () => import("./_ssr/admin-auth.functions-Q7pInwZ4.mjs")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
