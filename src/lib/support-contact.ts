/**
 * Public customer support contact (Muqatshop).
 * WhatsApp is the primary real-time channel.
 */

import { toWhatsAppPhone } from "@/lib/whatsapp/phone";

/** Display format as provided by the business. */
export const SUPPORT_WHATSAPP_DISPLAY = "01229660142";

/** E.164 without + for wa.me */
export const SUPPORT_WHATSAPP_E164 =
  toWhatsAppPhone(SUPPORT_WHATSAPP_DISPLAY) || "201229660142";

export const SUPPORT_EMAIL = "muqatshop@gmail.com";

export type SupportChatContext = {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  orderNumber?: string | null;
  topic?: string | null;
};

/** Build a wa.me deep link that opens chat immediately with an optional draft. */
export function buildSupportWhatsAppUrl(ctx?: SupportChatContext): string {
  const lines: string[] = ["السلام عليكم، محتاج مساعدة من دعم Muqatshop."];

  if (ctx?.topic?.trim()) lines.push(`الموضوع: ${ctx.topic.trim()}`);
  if (ctx?.fullName?.trim()) lines.push(`الاسم: ${ctx.fullName.trim()}`);
  if (ctx?.email?.trim()) lines.push(`البريد: ${ctx.email.trim()}`);
  if (ctx?.phone?.trim()) lines.push(`الهاتف: ${ctx.phone.trim()}`);
  if (ctx?.orderNumber?.trim()) lines.push(`رقم الطلب: ${ctx.orderNumber.trim()}`);

  lines.push("");
  lines.push("تفاصيل المشكلة:");

  const text = lines.join("\n");
  return `https://wa.me/${SUPPORT_WHATSAPP_E164}?text=${encodeURIComponent(text)}`;
}

export function supportWhatsAppHrefPlain(): string {
  return `https://wa.me/${SUPPORT_WHATSAPP_E164}`;
}
