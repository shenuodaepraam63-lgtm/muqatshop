import { supabase } from "@/lib/supabase";

export type Merchant = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  code?: string | null;
  created_at?: string;
};

export type MerchantSettings = {
  min_withdrawal: number;
  hold_days: number;
  /** نسبة عمولة من طلبات العملاء عبر رابط التاجر */
  commission_percent: number;
};

export type MerchantSession = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  code?: string | null;
};

const SESSION_KEY = "muqat_merchant_session";
export const MERCHANT_SESSION_EVENT = "muqat-merchant-session";

const STATUS_AR: Record<string, string> = {
  new: "قيد المراجعة",
  confirmed: "تم التأكيد",
  shipped: "قيد التوصيل",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`muqat_m_v1:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function makeMerchantCode(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function saveMerchantSession(m: MerchantSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(m));
  window.dispatchEvent(new Event(MERCHANT_SESSION_EVENT));
}

export function getMerchantSession(): MerchantSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearMerchantSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(MERCHANT_SESSION_EVENT));
}

export async function notifyMerchant(
  merchantId: string,
  body: string
): Promise<void> {
  if (!merchantId || !body.trim()) return;
  await supabase.from("merchant_messages").insert({
    merchant_id: merchantId,
    body: body.trim(),
  });
}

export async function getMerchantSettings(): Promise<MerchantSettings> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "merchant_settings")
    .maybeSingle();
  const v = (data?.value || {}) as {
    min_withdrawal?: number;
    hold_days?: number;
    commission_percent?: number;
  };
  return {
    min_withdrawal: typeof v.min_withdrawal === "number" ? v.min_withdrawal : 200,
    hold_days: typeof v.hold_days === "number" ? v.hold_days : 2,
    commission_percent:
      typeof v.commission_percent === "number" ? v.commission_percent : 10,
  };
}

export async function releaseMaturedProfits(merchantId?: string) {
  /**
   * Wallet credits must not be written from the browser under open RLS.
   * Admin UI should call /api/admin/merchant-ops with action release_matured_profits.
   * Merchant dashboard only triggers the same admin-protected path when a session token exists.
   */
  try {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) {
      console.warn("releaseMaturedProfits: no auth token — skipped (server-only)");
      return 0;
    }
    const res = await fetch("/api/admin/merchant-ops", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "release_matured_profits",
        merchantId: merchantId || undefined,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      released?: number;
    };
    if (!res.ok || !json.ok) return 0;
    return Number(json.released) || 0;
  } catch {
    return 0;
  }
}

export async function onOrderDelivered(orderId: string) {
  // Status transitions with wallet effects must run on the server (admin status API / merchant-ops).
  console.warn("onOrderDelivered: client path disabled — use admin order status API");
  void orderId;
}

export async function onOrderCancelled(orderId: string) {
  console.warn("onOrderCancelled: client path disabled — use admin order status API");
  void orderId;
}

export async function setMerchantOrderStatus(
  orderId: string,
  status: string,
  prevStatus?: string
) {
  void prevStatus;
  try {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) {
      console.warn("setMerchantOrderStatus: no auth token");
      return;
    }
    // Prefer protected order status route
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      console.warn("setMerchantOrderStatus failed", j);
    }
  } catch (e) {
    console.warn("setMerchantOrderStatus error", e);
  }
}
