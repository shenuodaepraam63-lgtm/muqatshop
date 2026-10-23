/** Store WhatsApp number (Egypt) — digits only with country code */
export const WHATSAPP_NUMBER = "201229660142";

export function whatsappProductUrl(productName: string, productUrl?: string) {
  const lines = [
    "السلام عليكم، مهتم بالمنتج:",
    productName,
  ];
  if (productUrl) lines.push(productUrl);
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
