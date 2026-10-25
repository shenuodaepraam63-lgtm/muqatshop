import { supabase } from "@/lib/supabase";

export type CustomerSession = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
};

const SESSION_KEY = "muqat_customer_session";
export const CUSTOMER_SESSION_EVENT = "muqat-customer-session";

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`muqat_c_v1:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function saveCustomerSession(c: CustomerSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(c));
  window.dispatchEvent(new Event(CUSTOMER_SESSION_EVENT));
}

export function getCustomerSession(): CustomerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearCustomerSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(CUSTOMER_SESSION_EVENT));
}

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createAndStoreOtp(
  email: string,
  purpose: "register" | "login" = "register"
): Promise<string> {
  const code = generateOtpCode();
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 15);

  await supabase
    .from("customer_otps")
    .update({ used: true })
    .eq("email", email.toLowerCase())
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

export async function verifyOtp(
  email: string,
  code: string,
  purpose: "register" | "login" = "register"
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
