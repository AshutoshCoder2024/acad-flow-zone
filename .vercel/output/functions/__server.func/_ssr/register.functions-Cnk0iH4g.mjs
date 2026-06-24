import { i as rollToEmail } from "./auth-helpers-BucyYuvz.mjs";
import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { n as coerce, o as objectType, r as enumType, s as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/register.functions-Cnk0iH4g.js
var registerSchema = objectType({
	role: enumType(["student", "teacher"]),
	full_name: stringType().trim().min(2).max(100),
	email: stringType().trim().email().max(255).optional(),
	roll: stringType().trim().min(2).max(40).optional(),
	department: stringType().trim().min(1).max(100).optional(),
	semester: coerce.number().int().min(1).max(12).optional(),
	password: stringType().min(6).max(128)
});
var registerAccount_createServerFn_handler = createServerRpc({
	id: "48aae3a053da4a0a2363e4ee3f785409c97a077338f78e7c7380293f26b21bd8",
	name: "registerAccount",
	filename: "src/functions/register.functions.ts"
}, (opts) => registerAccount.__executeServer(opts));
var registerAccount = createServerFn({ method: "POST" }).validator(registerSchema).handler(registerAccount_createServerFn_handler, async ({ data }) => {
	const { supabaseAdmin } = await import("./client.server-D1oHePJa.mjs");
	if (data.role === "student" && !data.roll) throw new Error("Roll number required");
	if (data.role === "teacher" && !data.email) throw new Error("Email required");
	if (data.role === "teacher" && !data.department) throw new Error("Department required");
	const email = data.role === "student" ? rollToEmail(data.roll) : data.email;
	const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
		email,
		password: data.password,
		email_confirm: true,
		user_metadata: {
			role: data.role,
			full_name: data.full_name,
			roll_number: data.roll ?? null,
			department: data.department ?? null,
			semester: data.semester ?? null
		}
	});
	if (error) {
		if (error.message.includes("already been registered") || error.message.includes("already exists")) throw new Error("An account with this email or roll number already exists.");
		throw new Error(error.message);
	}
	if (!created.user) throw new Error("Registration failed. Please try again.");
	return {
		role: data.role,
		userId: created.user.id
	};
});
//#endregion
export { registerAccount_createServerFn_handler };
