import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

function adminEnvMissing(): string | null {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    return "Administrator login is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD in .env.";
  }
  return null;
}

function buildTokenPayload(username: string, expiresAt: number, nonce: string) {
  return `${username}:${expiresAt}:${nonce}`;
}

function signToken(payload: string) {
  return createHmac("sha256", ADMIN_PASSWORD!).update(payload).digest("hex");
}

function encodeToken(payload: string, signature: string) {
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

function decodeToken(token: string) {
  const raw = Buffer.from(token, "base64url").toString("utf8");
  const parts = raw.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid administrator session token.");
  }

  const [username, expiresAtText, nonce, signature] = parts;
  const expiresAt = Number(expiresAtText);
  if (!username || Number.isNaN(expiresAt) || !nonce || !signature) {
    throw new Error("Invalid administrator session token.");
  }

  return { username, expiresAt, nonce, signature };
}

function createAdminToken(username: string) {
  const expiresAt = Date.now() + TOKEN_EXPIRY_MS;
  const nonce = randomBytes(16).toString("hex");
  const payload = buildTokenPayload(username, expiresAt, nonce);
  const signature = signToken(payload);
  return { token: encodeToken(payload, signature), expiresAt };
}

export function verifyAdminToken(token: string) {
  const configError = adminEnvMissing();
  if (configError) throw new Error(configError);

  const { username, expiresAt, nonce, signature } = decodeToken(token);
  const payload = buildTokenPayload(username, expiresAt, nonce);
  const expectedSignature = signToken(payload);

  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error("Invalid administrator session token.");
  }

  if (Date.now() > expiresAt) {
    throw new Error("Administrator session has expired. Please sign in again.");
  }

  if (username !== ADMIN_USERNAME) {
    throw new Error("Invalid administrator session.");
  }

  return { username };
}

export async function ensureAdminAccount(username: string, password: string) {
  const configError = adminEnvMissing();
  if (configError) throw new Error(configError);

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    throw new Error("Invalid administrator credentials.");
  }

  const { token, expiresAt } = createAdminToken(username);
  return { token, username, expiresAt };
}
