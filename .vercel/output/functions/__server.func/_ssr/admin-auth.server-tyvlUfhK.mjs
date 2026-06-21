import { createHmac, timingSafeEqual } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-auth.server-tyvlUfhK.js
var ADMIN_USERNAME = process.env.ADMIN_USERNAME;
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
var TOKEN_TTL_MS = 1440 * 60 * 1e3;
function adminEnvMissing() {
	if (!ADMIN_USERNAME || !ADMIN_PASSWORD) return "Administrator login is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD in .env.";
	return null;
}
function signPayload(username, expiresAt) {
	return createHmac("sha256", ADMIN_PASSWORD).update(`${username}:${expiresAt}`).digest("hex");
}
function createAdminToken(username) {
	const configError = adminEnvMissing();
	if (configError) throw new Error(configError);
	const expiresAt = Date.now() + TOKEN_TTL_MS;
	const signature = signPayload(username, expiresAt);
	return {
		token: Buffer.from(`${username}:${expiresAt}:${signature}`).toString("base64url"),
		username,
		expiresAt
	};
}
function verifyAdminToken(token) {
	const configError = adminEnvMissing();
	if (configError) throw new Error(configError);
	let decoded;
	try {
		decoded = Buffer.from(token, "base64url").toString("utf8");
	} catch {
		throw new Error("Invalid administrator session.");
	}
	const parts = decoded.split(":");
	if (parts.length !== 3) throw new Error("Invalid administrator session.");
	const [username, expiresStr, signature] = parts;
	const expiresAt = Number(expiresStr);
	if (!username || !Number.isFinite(expiresAt) || !signature) throw new Error("Invalid administrator session.");
	if (Date.now() > expiresAt) throw new Error("Administrator session expired.");
	const expected = signPayload(username, expiresAt);
	const sigBuf = Buffer.from(signature, "utf8");
	const expBuf = Buffer.from(expected, "utf8");
	if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) throw new Error("Invalid administrator session.");
	if (username !== ADMIN_USERNAME) throw new Error("Invalid administrator session.");
	return { username };
}
function loginAdmin(username, password) {
	const configError = adminEnvMissing();
	if (configError) throw new Error(configError);
	if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) throw new Error("Invalid administrator credentials.");
	return createAdminToken(username);
}
function assertAdminToken(token) {
	if (!token) throw new Error("Administrator session required.");
	return verifyAdminToken(token);
}
//#endregion
export { assertAdminToken, loginAdmin, verifyAdminToken };
