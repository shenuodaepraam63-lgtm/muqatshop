import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getWhatsAppConfig } from "./config";
import { toWhatsAppPhone } from "./phone";
import { sendWhatsAppTemplate } from "./send";

export type NotifyResult = {
  sent: boolean;
  reason?: string;
};

/**
 * Send order_received once per order. Safe to call multiple times.
 * Never throws; failures are returned as reason.
 */
export async function notifyOrderReceived(
  orderNumber: string
): Promise<NotifyResult> {
  const admin = getSupabaseAdmin();
  const cfg = getWhatsAppConfig();
  if (!admin) return { sent: false, reason: "supabase_admin_missing" };
  if (!cfg) return { sent: false, reason: "whatsapp_not_configured" };

  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, order_number, customer_name, phone, total, status, wa_received_sent_at, wa_received_message_id"
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !order) {
    return { sent: false, reason: "order_not_found" };
  }

  if (order.wa_received_sent_at || order.wa_received_message_id) {
    return { sent: false, reason: "already_sent" };
  }

  if (order.status === "cancelled") {
    return { sent: false, reason: "order_cancelled" };
  }

  const phone = toWhatsAppPhone(order.phone);
  if (!phone) {
    return { sent: false, reason: "invalid_phone" };
  }

  const totalStr =
    typeof order.total === "number"
      ? `${order.total} ج.م`
      : String(order.total ?? "");

  const result = await sendWhatsAppTemplate({
    to: phone,
    templateName: cfg.templates.orderReceived,
    bodyParams: [
      String(order.customer_name || "عميل"),
      String(order.order_number),
      totalStr,
    ],
    cfg,
  });

  if (!result.ok) {
    return { sent: false, reason: result.reason };
  }

  const now = new Date().toISOString();
  await admin
    .from("orders")
    .update({
      wa_received_message_id: result.messageId,
      wa_received_sent_at: now,
      updated_at: now,
    })
    .eq("id", order.id)
    .is("wa_received_message_id", null);

  return { sent: true };
}
