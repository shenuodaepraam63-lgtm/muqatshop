import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getWhatsAppConfig } from "./config";
import { phonesMatch } from "./phone";
import { sendWhatsAppTemplate } from "./send";

type ButtonReply = {
  id?: string;
  title?: string;
};

type InboundMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  button?: { payload?: string; text?: string };
  interactive?: {
    type?: string;
    button_reply?: ButtonReply;
    list_reply?: { id?: string; title?: string };
  };
  context?: { id?: string; from?: string };
};

function classifyButton(
  text: string,
  confirmIds: string[],
  cancelIds: string[]
): "confirm" | "cancel" | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  if (confirmIds.some((id) => t === id || t.includes(id))) return "confirm";
  if (cancelIds.some((id) => t === id || t.includes(id))) return "cancel";
  if (/تأكيد|confirm|yes|موافق/.test(t)) return "confirm";
  if (/إلغاء|الغاء|cancel|رفض/.test(t)) return "cancel";
  return null;
}

async function markProcessed(
  wamid: string,
  action: string,
  orderId?: string | null
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const { error } = await admin.from("whatsapp_processed_messages").insert({
    wamid,
    action,
    order_id: orderId || null,
  });
  if (error) return false;
  return true;
}

export async function handleInboundWhatsAppMessages(
  messages: InboundMessage[]
): Promise<void> {
  const admin = getSupabaseAdmin();
  const cfg = getWhatsAppConfig();
  if (!admin || !cfg) return;

  for (const msg of messages) {
    if (!msg?.id || !msg.from) continue;

    const reply =
      msg.interactive?.button_reply ||
      (msg.button
        ? { id: msg.button.payload, title: msg.button.text }
        : null) ||
      msg.interactive?.list_reply;

    if (!reply) continue;

    const token = `${reply.id || ""} ${reply.title || ""}`;
    const action = classifyButton(
      token,
      cfg.buttonConfirmIds,
      cfg.buttonCancelIds
    );
    if (!action) continue;

    const firstTime = await markProcessed(msg.id, action);
    if (!firstTime) continue;

    const contextId = msg.context?.id;

    let order: {
      id: string;
      order_number: string;
      customer_name: string;
      phone: string;
      total: number;
      status: string;
      wa_confirmed_sent_at: string | null;
      wa_cancelled_sent_at: string | null;
    } | null = null;

    if (contextId) {
      const { data } = await admin
        .from("orders")
        .select(
          "id, order_number, customer_name, phone, total, status, wa_confirmed_sent_at, wa_cancelled_sent_at"
        )
        .eq("wa_received_message_id", contextId)
        .maybeSingle();
      order = data;
    }

    if (!order) {
      const { data: list } = await admin
        .from("orders")
        .select(
          "id, order_number, customer_name, phone, total, status, wa_confirmed_sent_at, wa_cancelled_sent_at, created_at"
        )
        .in("status", ["new", "confirmed"])
        .order("created_at", { ascending: false })
        .limit(15);

      order =
        (list || []).find((o) => phonesMatch(o.phone, msg.from)) || null;
    }

    if (!order) continue;
    if (!phonesMatch(order.phone, msg.from)) continue;

    const now = new Date().toISOString();
    const totalStr =
      typeof order.total === "number"
        ? `${order.total} ج.م`
        : String(order.total ?? "");

    if (action === "confirm") {
      if (order.status === "cancelled") continue;
      if (order.status === "shipped" || order.status === "delivered") continue;

      if (order.status === "new") {
        await admin
          .from("orders")
          .update({
            status: "confirmed",
            customer_confirmed_at: now,
            updated_at: now,
          })
          .eq("id", order.id)
          .eq("status", "new");
      } else if (!order.wa_confirmed_sent_at) {
        await admin
          .from("orders")
          .update({
            customer_confirmed_at: now,
            updated_at: now,
          })
          .eq("id", order.id);
      }

      if (!order.wa_confirmed_sent_at) {
        const sent = await sendWhatsAppTemplate({
          to: msg.from,
          templateName: cfg.templates.orderConfirmed,
          bodyParams: [
            String(order.customer_name || "عميل"),
            String(order.order_number),
            totalStr,
          ],
          cfg,
        });
        if (sent.ok) {
          await admin
            .from("orders")
            .update({ wa_confirmed_sent_at: now, updated_at: now })
            .eq("id", order.id)
            .is("wa_confirmed_sent_at", null);
        }
      }
    }

    if (action === "cancel") {
      if (order.status === "shipped" || order.status === "delivered") continue;
      if (order.status === "cancelled") continue;

      await admin
        .from("orders")
        .update({
          status: "cancelled",
          cancel_source: "whatsapp",
          updated_at: now,
        })
        .eq("id", order.id)
        .in("status", ["new", "confirmed"]);

      if (!order.wa_cancelled_sent_at) {
        const sent = await sendWhatsAppTemplate({
          to: msg.from,
          templateName: cfg.templates.orderCancelled,
          bodyParams: [
            String(order.customer_name || "عميل"),
            String(order.order_number),
          ],
          cfg,
        });
        if (sent.ok) {
          await admin
            .from("orders")
            .update({ wa_cancelled_sent_at: now, updated_at: now })
            .eq("id", order.id)
            .is("wa_cancelled_sent_at", null);
        }
      }
    }
  }
}
