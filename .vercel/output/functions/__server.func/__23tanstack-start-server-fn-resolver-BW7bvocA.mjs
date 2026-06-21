//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-BW7bvocA.js
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
		importer: () => import("./_ssr/admin-api.functions-Chai1JNK.mjs")
	},
	"828c9b6436ea019fd107cccecb9ff63e07a29131f42fdf1255da0724f373f1f3": {
		functionName: "adminRejectTeacher_createServerFn_handler",
		importer: () => import("./_ssr/admin-api.functions-Chai1JNK.mjs")
	},
	"aa43677ae01abaef43705634754a0d41438c6318198a6fc9b26560d4437693d5": {
		functionName: "adminApproveTeacher_createServerFn_handler",
		importer: () => import("./_ssr/admin-api.functions-Chai1JNK.mjs")
	},
	"c664209477ed7421d781473e2e872dbe9c45c2e41225424a324062e8b63e0367": {
		functionName: "fetchAdminDashboard_createServerFn_handler",
		importer: () => import("./_ssr/admin-api.functions-Chai1JNK.mjs")
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
