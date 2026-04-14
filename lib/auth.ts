// Works in both Edge (middleware) and Node (API route) runtimes by using Web Crypto only.

const COOKIE_NAME = "ir_session";
const SEVEN_DAYS = 60 * 60 * 24 * 7;

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET env var is missing or too short (min 16 chars).");
  }
  return s;
}

function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecodeToString(str: string): string {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const s = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function hmac(input: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(input));
  return b64urlEncode(sig);
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signSession(
  username: string,
): Promise<{ value: string; maxAge: number }> {
  const exp = Math.floor(Date.now() / 1000) + SEVEN_DAYS;
  const userB64 = b64urlEncode(new TextEncoder().encode(username));
  const payload = `${userB64}.${exp}`;
  const sig = await hmac(payload);
  return { value: `${payload}.${sig}`, maxAge: SEVEN_DAYS };
}

export async function verifySession(
  value: string | undefined,
): Promise<{ username: string } | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [userB64, expStr, sig] = parts;
  const expected = await hmac(`${userB64}.${expStr}`);
  if (!timingSafeEqualStr(sig, expected)) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
  try {
    return { username: b64urlDecodeToString(userB64) };
  } catch {
    return null;
  }
}

export function checkCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.APP_USERNAME ?? "";
  const expectedPass = process.env.APP_PASSWORD ?? "";
  if (!expectedUser || !expectedPass) return false;
  return timingSafeEqualStr(username, expectedUser) && timingSafeEqualStr(password, expectedPass);
}

export const SESSION_COOKIE = COOKIE_NAME;
