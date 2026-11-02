/**
 * Server-side admin alerts: in-app feed + WhatsApp to store owner.
 */

import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { getWhatsAppConfig, graphMessagesUrl } from "@/lib/whatsapp/config";
import { toWhatsAppPhone } from "@/lib/whatsapp/phone";

export type AdminNotifyType = "new_order" | "new_account" | "system";

function adminPhone(): string {
  const raw =
    process.env.ADMIN_WHATSAPP_NUMBER?.trim() ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
    "201229660142";
  return toWhatsAppPhone(raw) || "201229660142";
}

async function sendAdminWhatsAppText(body: string): Promise<boolean> {
  const cfg = getWhatsAppConfig();
  if (!cfg) return false;
  const to = adminPhone();
  if (!to) return false;

  try {
    const res = await fetch(graphMessagesUrl(cfg), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: body.slice(0, 4000), preview_url: false },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function notifyAdmin(opts: {
  type: AdminNotifyType;
  title: string;
  body?: string;
  meta?: Record<string, unknown>;
}): Promise<{ ok: boolean; id?: string }> {
  let id: string | undefined;

  try {
    const admin = getSupabaseServiceClient();
    const { data, error } = await admin
      .from("admin_notifications")
      .insert({
        type: opts.type,
        title: opts.title.slice(0, 200),
        body: opts.body?.slice(0, 2000) || null,
        meta: opts.meta || {},
      })
      .select("id")
      .maybeSingle();

    if (!error && data?.id) id = data.id as string;
  } catch (e) {
    console.error("admin_notifications insert failed", e);
  }

  const waBody = [opts.title, opts.body].filter(Boolean).join("\n");
  try {
    await sendAdminWhatsAppText(waBody);
  } catch (e) {
    console.error("admin whatsapp notify failed", e);
  }

  return { ok: true, id };
}

export async function notifyAdminNewOrder(opts: {
  orderNumber: string;
  customerName: string;
  phone?: string;
  total: number | string;
  paymentMethod?: string;
}) {
  const pay =
    opts.paymentMethod === "prepaid_whatsapp"
      ? "دفع مقدّم / واتساب"
      : "دفع عند الاستلام";
  return notifyAdmin({
    type: "new_order",
    title: `طلب جديد ${opts.orderNumber}`,
    body: `العميل: ${opts.customerName}\nالهاتف: ${opts.phone || "—"}\nالإجمالي: ${opts.total} ج.م\nالدفع: ${pay}`,
    meta: {
      order_number: opts.orderNumber,
      total: opts.total,
      payment_method: opts.paymentMethod || "cod",
    },
  });
}

export async function notifyAdminNewAccount(opts: {
  email: string;
  fullName?: string;
  accountType?: string;
  phone?: string;
}) {
  const typeLabel =
    opts.accountType === "affiliate" || opts.accountType === "merchant"
      ? "مسوق"
      : opts.accountType === "supplier"
        ? "مورد"
        : "عميل";
  return notifyAdmin({
    type: "new_account",
    title: `حساب جديد (${typeLabel})`,
    body: `الاسم: ${opts.fullName || "—"}\nالبريد: ${opts.email}\nالهاتف: ${opts.phone || "—"}`,
    meta: {
      email: opts.email,
      account_type: opts.accountType || "customer",
    },
  });
}
