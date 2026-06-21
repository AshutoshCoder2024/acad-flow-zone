import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-BbVyVwjV.js
function createSupabaseClient() {
	return createClient("https://uvoarjvaiepglghbwudn.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2b2FyanZhaWVwZ2xnaGJ3dWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NzU0NDMsImV4cCI6MjA5NzU1MTQ0M30.kR2WEITaAvLiKMGzb5d6fYZoP0XPw0zmNRvnYoAJrT4", { auth: {
		storage: typeof window !== "undefined" ? localStorage : void 0,
		persistSession: true,
		autoRefreshToken: true
	} });
}
var _supabase;
var supabase = new Proxy({}, { get(_, prop, receiver) {
	if (!_supabase) _supabase = createSupabaseClient();
	return Reflect.get(_supabase, prop, receiver);
} });
//#endregion
export { supabase as t };
