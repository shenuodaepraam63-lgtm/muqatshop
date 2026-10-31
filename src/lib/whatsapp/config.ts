/**
 * Server-side WhatsApp Cloud API configuration (env only).
 */

export type WhatsAppConfig = {
  accessToken: string;
  phoneNumberId: string;
  verifyToken: string;
  appSecret: string;
  apiVersion: string;
  templateLang: string;
  templates: {
    orderReceived: string;
    orderConfirmed: string;
    orderCancelled: string;
  };
  buttonConfirmIds: string[];
  buttonCancelIds: string[];
};

function splitList(v: string | undefined, fallback: string[]): string[] {
  if (!v?.trim()) return fallback;
  return v
    .split(/[,|]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function getWhatsAppConfig(): WhatsAppConfig | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();

  if (!accessToken || !phoneNumberId) return null;

  return {
    accessToken,
    phoneNumberId,
    verifyToken: verifyToken || "",
    appSecret: appSecret || "",
    apiVersion: (
      process.env.WHATSAPP_API_VERSION ||
      process.env.META_GRAPH_API_VERSION ||
      "v21.0"
    ).replace(/^\/+/, ""),
    templateLang: process.env.WHATSAPP_TEMPLATE_LANG?.trim() || "ar",
    templates: {
      orderReceived:
        process.env.WHATSAPP_TEMPLATE_ORDER_RECEIVED?.trim() ||
        "order_received",
      orderConfirmed:
        process.env.WHATSAPP_TEMPLATE_ORDER_CONFIRMED?.trim() ||
        "order_confirmed",
      orderCancelled:
        process.env.WHATSAPP_TEMPLATE_ORDER_CANCELLED?.trim() ||
        "order_cancelled",
    },
    buttonConfirmIds: splitList(process.env.WHATSAPP_BUTTON_CONFIRM_IDS, [
      "confirm",
      "confirm_order",
      "تأكيد",
      "تأكيد الطلب",
      "yes",
    ]),
    buttonCancelIds: splitList(process.env.WHATSAPP_BUTTON_CANCEL_IDS, [
      "cancel",
      "cancel_order",
      "إلغاء",
      "الغاء",
      "إلغاء الطلب",
      "no",
    ]),
  };
}

export function graphMessagesUrl(cfg: WhatsAppConfig): string {
  return `https://graph.facebook.com/${cfg.apiVersion}/${cfg.phoneNumberId}/messages`;
}
