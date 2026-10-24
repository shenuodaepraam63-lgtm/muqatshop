import { supabase } from "@/lib/supabase";

export type Merchant = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  created_at?: string;
};

export type MerchantSettings = {
  min_withdrawal: number;
  hold_days: number;
};

const SESSION_KEY = "muqat_merchant_session";

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`muqat_m_v1:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function saveMerchantSession(m: Pick<Merchant, "id" | "email" | "name" | "phone">) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id: m.id, email: m.email, name: m.name, phone: m.phone })
  );
}

export function getMerchantSession(): {
  id: string;
  email: string;
  name: string;
  phone: string | null;
} | null {
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
}

export async function getMerchantSettings(): Promise<MerchantSettings> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "merchant_settings")
    .maybeSingle();
  const v = (data?.value || {}) as { min_withdrawal?: number; hold_days?: number };
  return {
    min_withdrawal: typeof v.min_withdrawal === "number" ? v.min_withdrawal : 200,
    hold_days: typeof v.hold_days === "number" ? v.hold_days : 2,
  };
}

export async function releaseMaturedProfits(merchantId?: string) {
  let q = supabase
    .from("orders")
    .select("id, merchant_id, merchant_profit, hold_until")
    .eq("status", "delivered")
    .eq("profit_released", false)
    .not("merchant_id", "is", null)
    .not("hold_until", "is", null)
    .lte("hold_until", new Date().toISOString());

  if (merchantId) q = q.eq("merchant_id", merchantId);

  const { data: orders } = await q;
  if (!orders?.length) return 0;

  let released = 0;
  for (const o of orders) {
    const profit = Number(o.merchant_profit) || 0;
    if (profit <= 0 || !o.merchant_id) {
      await supabase.from("orders").update({ profit_released: true }).eq("id", o.id);
      continue;
    }

    const { data: wallet } = await supabase
      .from("merchant_wallets")
      .select("balance, pending")
      .eq("merchant_id", o.merchant_id)
      .maybeSingle();

    if (!wallet) continue;

    const pending = Math.max(0, Number(wallet.pending) - profit);
    const balance = Number(wallet.balance) + profit;

    await supabase
      .from("merchant_wallets")
      .update({ balance, pending, updated_at: new Date().toISOString() })
      .eq("merchant_id", o.merchant_id);

    await supabase.from("wallet_transactions").insert({
      merchant_id: o.merchant_id,
      type: "release",
      amount: profit,
      order_id: o.id,
      note: "تحرير عمولة بعد انتهاء فترة الانتظار",
    });

    await supabase.from("orders").update({ profit_released: true }).eq("id", o.id);
    released += 1;
  }
  return released;
}

export async function onOrderDelivered(orderId: string) {
  const settings = await getMerchantSettings();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (!order?.merchant_id || Number(order.merchant_profit) <= 0) {
    await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId);
    return;
  }

  const holdUntil = new Date();
  holdUntil.setDate(holdUntil.getDate() + settings.hold_days);

  await supabase
    .from("orders")
    .update({
      status: "delivered",
      hold_until: holdUntil.toISOString(),
      profit_released: false,
    })
    .eq("id", orderId);

  const profit = Number(order.merchant_profit) || 0;
  const { data: wallet } = await supabase
    .from("merchant_wallets")
    .select("pending")
    .eq("merchant_id", order.merchant_id)
    .maybeSingle();

  if (wallet) {
    await supabase
      .from("merchant_wallets")
      .update({
        pending: Number(wallet.pending) + profit,
        updated_at: new Date().toISOString(),
      })
      .eq("merchant_id", order.merchant_id);

    await supabase.from("wallet_transactions").insert({
      merchant_id: order.merchant_id,
      type: "hold",
      amount: profit,
      order_id: orderId,
      note: `عمولة معلّقة ${settings.hold_days} يوم بعد التسليم`,
    });
  }
}

export async function onOrderCancelled(orderId: string) {
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (!order?.merchant_id || Number(order.merchant_profit) <= 0) {
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    return;
  }

  const profit = Number(order.merchant_profit) || 0;
  const { data: wallet } = await supabase
    .from("merchant_wallets")
    .select("balance, pending")
    .eq("merchant_id", order.merchant_id)
    .maybeSingle();

  if (wallet) {
    if (order.profit_released) {
      await supabase
        .from("merchant_wallets")
        .update({
          balance: Math.max(0, Number(wallet.balance) - profit),
          updated_at: new Date().toISOString(),
        })
        .eq("merchant_id", order.merchant_id);
    } else if (order.hold_until) {
      await supabase
        .from("merchant_wallets")
        .update({
          pending: Math.max(0, Number(wallet.pending) - profit),
          updated_at: new Date().toISOString(),
        })
        .eq("merchant_id", order.merchant_id);
    }

    await supabase.from("wallet_transactions").insert({
      merchant_id: order.merchant_id,
      type: "clawback",
      amount: -profit,
      order_id: orderId,
      note: "استرجاع عمولة بسبب إلغاء/مرتجع",
    });
  }

  await supabase
    .from("orders")
    .update({ status: "cancelled", profit_released: true })
    .eq("id", orderId);
}
