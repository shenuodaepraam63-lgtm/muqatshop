import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { IDENTITY_COOKIE_NAME, IDENTITY_TTL_DAYS } from "./types";

function secret(): string {
  const s =
    process.env.ANALYTICS_COOKIE_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "";
  if (!s) throw new Error("ANALYTICS_COOKIE_SECRET_MISSING");
  return s;
}

export function hashIdentityToken(token: string): string {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

/** Signed value: token.exp.sig */
export function signIdentityToken(token: string, expiresAtMs: number): string {
  const payload = `${token}.${expiresAtMs}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyIdentityCookie(
  raw: string | undefined
): { token: string; expiresAtMs: number } | null {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [token, expStr, sig] = parts;
  if (!token || !expStr || !sig) return null;
  const expiresAtMs = Number(expStr);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs < Date.now()) return null;
  const payload = `${token}.${expStr}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) return null;
  return { token, expiresAtMs };
}

export function mintIdentityToken(): { token: string; expiresAtMs: number; cookieValue: string } {
  const token = randomBytes(24).toString("base64url");
  const expiresAtMs = Date.now() + IDENTITY_TTL_DAYS * 24 * 60 * 60 * 1000;
  return {
    token,
    expiresAtMs,
    cookieValue: signIdentityToken(token, expiresAtMs),
  };
}

export function identitySetCookieHeader(cookieValue: string, expiresAtMs: number): string {
  const maxAge = Math.max(60, Math.floor((expiresAtMs - Date.now()) / 1000));
  const secure =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1"
      ? "; Secure"
      : "";
  return `${IDENTITY_COOKIE_NAME}=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function readIdentityFromRequest(request: Request): string | undefined {
  const header = request.headers.get("cookie") || "";
  const parts = header.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(`${IDENTITY_COOKIE_NAME}=`)) {
      return decodeURIComponent(p.slice(IDENTITY_COOKIE_NAME.length + 1));
    }
  }
  return undefined;
}
