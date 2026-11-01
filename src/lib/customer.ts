/**
 * LEGACY MODULE — do not use for auth or route protection.
 * Customer identity is Supabase Auth + profiles / v_account_identity only (MQS-AUTH-002).
 *
 * Kept only so signOutEverywhere can clear old localStorage keys from previous builds.
 * OTP helpers remain for any leftover admin tooling; customer UX must not call them.
 */

import { supabase } from "@/lib/supabase";

export type CustomerSession = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
};

/** @deprecated OTP is not the default customer UX (use email magic links). */
export type OtpPurpose = "register" | "reset" | "delete" | "login";

const SESSION_KEY = "muqat_customer_session";
export const CUSTOMER_SESSION_EVENT = "muqat-customer-session";

/** @deprecated */
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`muqat_c_v1:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** @deprecated Do not establish customer identity from localStorage. */
export function saveCustomerSession(_c: CustomerSession) {
  // no-op: legacy write disabled
}

/** @deprecated Always null — use loadAccountIdentity / supabase.auth */
export function getCustomerSession(): CustomerSession | null {
  return null;
}

/** Clears leftover key from older app versions. */
export function clearCustomerSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event(CUSTOMER_SESSION_EVENT));
  } catch {
    /* */
  }
}

/** @deprecated */
export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** @deprecated */
export async function createAndStoreOtp(
  email: string,
  purpose: OtpPurpose = "register"
): Promise<string> {
  const code = generateOtpCode();
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 15);

  await supabase
    .from("customer_otps")
    .update({ used: true })
    .eq("email", email.toLowerCase())
    .eq("purpose", purpose)
    .eq("used", false);

  await supabase.from("customer_otps").insert({
    email: email.toLowerCase().trim(),
    code,
    purpose,
    expires_at: expires.toISOString(),
    used: false,
  });

  return code;
}

/** @deprecated */
export async function verifyOtp(
  email: string,
  code: string,
  purpose: OtpPurpose = "register"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data } = await supabase
    .from("customer_otps")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .eq("code", code.trim())
    .eq("purpose", purpose)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return { ok: false, error: "رمز التحقق غير صحيح" };
  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "انتهت صلاحية الرمز — اطلب رمزًا جديدًا" };
  }

  await supabase.from("customer_otps").update({ used: true }).eq("id", data.id);
  return { ok: true };
}

/** @deprecated */
export async function sendCustomerMail(payload: {
  email: string;
  name?: string;
  code?: string;
  purpose: OtpPurpose | "notice_delete" | "notice_password";
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) return { ok: false, error: j.error || "فشل إرسال البريد" };
    return { ok: true };
  } catch {
    return { ok: false, error: "تعذر الاتصال بخدمة البريد" };
  }
}
