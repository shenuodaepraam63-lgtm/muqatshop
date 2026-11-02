/**
 * Products that require payment in advance + WhatsApp confirmation
 * before delivery (not cash on delivery).
 *
 * Currently: all earbuds / TWS / FDY earbud models.
 */

const EARBUD_NAME_RE =
  /ايربودز|إيربودز|ايربود|إيربود|earbud|earbuds|\btws\b|\bfdy\s*t\d+/i;

export function isPrepaidRequiredProduct(name: string | null | undefined): boolean {
  if (!name) return false;
  return EARBUD_NAME_RE.test(name);
}

export function cartRequiresPrepaid(
  items: { name?: string | null }[]
): boolean {
  return items.some((i) => isPrepaidRequiredProduct(i.name));
}

/** Public WhatsApp number for order confirmation (digits with country code). */
export function getStoreWhatsAppE164(): string {
  const raw =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER) ||
    "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10) {
    if (digits.startsWith("0") && digits.length === 11) {
      return `20${digits.slice(1)}`;
    }
    if (digits.startsWith("20")) return digits;
    return digits;
  }
  // Fallback empty — UI will hide deep-link if missing
  return "";
}

export function buildWhatsAppOrderConfirmUrl(opts: {
  orderNumber: string;
  customerName?: string;
  total?: number | string;
}): string | null {
  const phone = getStoreWhatsAppE164();
  if (!phone) return null;
  const lines = [
    "مرحباً Muqatshop",
    `أريد تأكيد طلبي رقم: ${opts.orderNumber}`,
  ];
  if (opts.customerName) lines.push(`الاسم: ${opts.customerName}`);
  if (opts.total != null && opts.total !== "") {
    lines.push(`الإجمالي: ${opts.total} ج.م`);
  }
  lines.push("الدفع مقدّم لسماعات الإيربودز — بانتظار تفاصيل التحويل.");
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${phone}?text=${text}`;
}
