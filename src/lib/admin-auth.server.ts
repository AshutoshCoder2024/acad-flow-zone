import { createHmac, timingSafeEqual } from "node:crypto";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export type AdminLoginResult = {
  token: string;
  username: string;
  expiresAt: number;
};

function adminEnvMissing(): string | null {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    return "Administrator login is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD in .env.";
  }
  return null;
}

function signPayload(username: string, expiresAt: number): string {
  return createHmac("sha256", ADMIN_PASSWORD!)
    .update(`${username}:${expiresAt}`)
    .digest("hex");
}

export function createAdminToken(username: string): AdminLoginResult {
  const configError = adminEnvMissing();
  if (configError) throw new Error(configError);

  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const signature = signPayload(username, expiresAt);
  const token = Buffer.from(`${username}:${expiresAt}:${signature}`).toString("base64url");

  return { token, username, expiresAt };
}

export function verifyAdminToken(token: string): { username: string } {
  const configError = adminEnvMissing();
  if (configError) throw new Error(configError);

  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    throw new Error("Invalid administrator session.");
  }

  const parts = decoded.split(":");
  if (parts.length !== 3) throw new Error("Invalid administrator session.");

  const [username, expiresStr, signature] = parts;
  const expiresAt = Number(expiresStr);

  if (!username || !Number.isFinite(expiresAt) || !signature) {
    throw new Error("Invalid administrator session.");
  }

  if (Date.now() > expiresAt) throw new Error("Administrator session expired.");

  const expected = signPayload(username, expiresAt);
  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");

  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    throw new Error("Invalid administrator session.");
  }

  if (username !== ADMIN_USERNAME) throw new Error("Invalid administrator session.");

  return { username };
}

export function loginAdmin(username: string, password: string): AdminLoginResult {
  const configError = adminEnvMissing();
  if (configError) throw new Error(configError);

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    throw new Error("Invalid administrator credentials.");
  }

  return createAdminToken(username);
}

export function assertAdminToken(token: string | undefined | null): { username: string } {
  if (!token) throw new Error("Administrator session required.");
  return verifyAdminToken(token);
}
