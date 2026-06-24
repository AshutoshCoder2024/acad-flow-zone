import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-auth.functions-Q7pInwZ4.js
var adminSignInSchema = objectType({
	username: stringType().trim().min(1).max(100),
	password: stringType().min(1).max(128)
});
var adminTokenSchema = objectType({ token: stringType().min(1) });
var adminLogin_createServerFn_handler = createServerRpc({
	id: "03c9c7ffc1d7fa871964f8f6e2c23b41c19d8524845a0fafdae2cf8de722a9f2",
	name: "adminLogin",
	filename: "src/functions/admin-auth.functions.ts"
}, (opts) => adminLogin.__executeServer(opts));
var adminLogin = createServerFn({ method: "POST" }).validator(adminSignInSchema).handler(adminLogin_createServerFn_handler, async ({ data }) => {
	const { loginAdmin } = await import("./admin-auth.server-tyvlUfhK.mjs");
	return loginAdmin(data.username, data.password);
});
var validateAdminSession_createServerFn_handler = createServerRpc({
	id: "f70b5f7c47f67605d7c0ed6abb2a723a6190b36209f60cd3087bb7ea7ebbc630",
	name: "validateAdminSession",
	filename: "src/functions/admin-auth.functions.ts"
}, (opts) => validateAdminSession.__executeServer(opts));
var validateAdminSession = createServerFn({ method: "POST" }).validator(adminTokenSchema).handler(validateAdminSession_createServerFn_handler, async ({ data }) => {
	const { verifyAdminToken } = await import("./admin-auth.server-tyvlUfhK.mjs");
	const { username } = verifyAdminToken(data.token);
	return {
		valid: true,
		username
	};
});
//#endregion
export { adminLogin_createServerFn_handler, validateAdminSession_createServerFn_handler };
