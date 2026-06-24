import { i as __toESM } from "../_runtime.mjs";
import { f as Outlet, v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-BbVyVwjV.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { i as useAuth } from "./use-auth-eL2T4SAm.mjs";
import { g as LoaderCircle } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-CYzMO_AJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AuthGate() {
	const { user, profile, loading, isEnvAdmin } = useAuth();
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		if (!loading && !user && !isEnvAdmin) navigate({
			to: "/auth",
			replace: true
		});
	}, [
		loading,
		user,
		isEnvAdmin,
		navigate
	]);
	(0, import_react.useEffect)(() => {
		if (loading || isEnvAdmin || !user || !profile) return;
		if (profile.verification_status === "pending" || profile.verification_status === "rejected") supabase.auth.signOut().then(() => navigate({
			to: "/auth",
			replace: true
		}));
	}, [
		loading,
		user,
		profile,
		isEnvAdmin,
		navigate
	]);
	if (loading || !user && !isEnvAdmin) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-screen place-items-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {});
}
//#endregion
export { AuthGate as component };
