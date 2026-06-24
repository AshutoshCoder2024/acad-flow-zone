import { i as __toESM } from "../_runtime.mjs";
import { r as highestRole } from "./auth-helpers-BucyYuvz.mjs";
import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-BjFE6WQg.mjs";
import { i as TSS_SERVER_FUNCTION, l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as supabase } from "./client-BbVyVwjV.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-auth-eL2T4SAm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STORAGE_KEY = "deptportal_admin_session";
function saveAdminSession(session) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}
function getAdminSession() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!parsed.token || !parsed.expiresAt || Date.now() > parsed.expiresAt) {
			clearAdminSession();
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}
function clearAdminSession() {
	localStorage.removeItem(STORAGE_KEY);
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var adminSignInSchema = objectType({
	username: stringType().trim().min(1).max(100),
	password: stringType().min(1).max(128)
});
var adminTokenSchema = objectType({ token: stringType().min(1) });
var adminLogin = createServerFn({ method: "POST" }).validator(adminSignInSchema).handler(createSsrRpc("03c9c7ffc1d7fa871964f8f6e2c23b41c19d8524845a0fafdae2cf8de722a9f2"));
var validateAdminSession = createServerFn({ method: "POST" }).validator(adminTokenSchema).handler(createSsrRpc("f70b5f7c47f67605d7c0ed6abb2a723a6190b36209f60cd3087bb7ea7ebbc630"));
var Ctx = (0, import_react.createContext)(void 0);
var ENV_ADMIN_PROFILE = {
	id: "env-admin",
	email: "admin@local",
	full_name: "Administrator",
	roll_number: null,
	department: null,
	semester: null,
	avatar_url: null,
	verification_status: "not_applicable"
};
function AuthProvider({ children }) {
	const [user, setUser] = (0, import_react.useState)(null);
	const [session, setSession] = (0, import_react.useState)(null);
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [roles, setRoles] = (0, import_react.useState)([]);
	const [isEnvAdmin, setIsEnvAdmin] = (0, import_react.useState)(false);
	const [adminToken, setAdminToken] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	async function loadFor(u) {
		if (!u) {
			if (!getAdminSession()) {
				setProfile(null);
				setRoles([]);
			}
			return;
		}
		const [{ data: prof }, { data: roleRows }] = await Promise.all([supabase.from("profiles").select("*").eq("id", u.id).maybeSingle(), supabase.from("user_roles").select("role").eq("user_id", u.id)]);
		setProfile(prof ?? null);
		setRoles((roleRows ?? []).map((r) => r.role));
	}
	async function loadEnvAdmin() {
		const stored = getAdminSession();
		if (!stored) {
			setIsEnvAdmin(false);
			setAdminToken(null);
			return false;
		}
		try {
			await validateAdminSession({ data: { token: stored.token } });
			setIsEnvAdmin(true);
			setAdminToken(stored.token);
			setProfile(ENV_ADMIN_PROFILE);
			setRoles(["admin"]);
			return true;
		} catch {
			clearAdminSession();
			setIsEnvAdmin(false);
			setAdminToken(null);
			return false;
		}
	}
	async function refresh() {
		const envOk = await loadEnvAdmin();
		const { data } = await supabase.auth.getSession();
		setSession(data.session);
		setUser(data.session?.user ?? null);
		if (data.session?.user) await loadFor(data.session.user);
		else if (envOk) {
			setProfile(ENV_ADMIN_PROFILE);
			setRoles(["admin"]);
		} else if (!envOk) {
			setProfile(null);
			setRoles([]);
		}
	}
	function setEnvAdminSession(adminSession) {
		saveAdminSession(adminSession);
		setIsEnvAdmin(true);
		setAdminToken(adminSession.token);
		setProfile(ENV_ADMIN_PROFILE);
		setRoles(["admin"]);
	}
	(0, import_react.useEffect)(() => {
		const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
			setSession(sess);
			setUser(sess?.user ?? null);
			setTimeout(async () => {
				const envOk = await loadEnvAdmin();
				if (sess?.user) await loadFor(sess.user);
				else if (envOk) {
					setProfile(ENV_ADMIN_PROFILE);
					setRoles(["admin"]);
				} else if (!envOk) {
					setProfile(null);
					setRoles([]);
				}
			}, 0);
		});
		refresh().finally(() => setLoading(false));
		return () => sub.subscription.unsubscribe();
	}, []);
	const role = isEnvAdmin ? "admin" : highestRole(roles);
	async function signOut() {
		clearAdminSession();
		setIsEnvAdmin(false);
		setAdminToken(null);
		await supabase.auth.signOut();
		setProfile(null);
		setRoles([]);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ctx.Provider, {
		value: {
			user,
			session,
			profile,
			roles,
			role,
			isEnvAdmin,
			adminToken,
			loading,
			refresh,
			signOut,
			setEnvAdminSession
		},
		children
	});
}
function useAuth() {
	const ctx = (0, import_react.useContext)(Ctx);
	if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
	return ctx;
}
//#endregion
export { useAuth as i, adminLogin as n, createSsrRpc as r, AuthProvider as t };
