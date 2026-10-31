/**
 * Normalize Egyptian mobile numbers to WhatsApp E.164 without "+".
 * Returns null if the number is not usable.
 */
export function toWhatsAppPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, "");
  if (!d) return null;

  // 00201… → 201…
  if (d.startsWith("00")) d = d.slice(2);

  // 01xxxxxxxxx (11 digits local)
  if (d.startsWith("01") && d.length === 11) {
    d = "20" + d.slice(1);
  }
  // 1xxxxxxxxx without leading 0
  if (d.startsWith("1") && d.length === 10) {
    d = "20" + d;
  }
  // already 201…
  if (d.startsWith("201") && d.length === 12) {
    return d;
  }
  // international with country already
  if (d.startsWith("20") && d.length >= 12 && d.length <= 15) {
    return d;
  }
  return null;
}

/** Compare two phones loosely (last 9–10 digits). */
export function phonesMatch(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const na = toWhatsAppPhone(a) || String(a || "").replace(/\D/g, "");
  const nb = toWhatsAppPhone(b) || String(b || "").replace(/\D/g, "");
  if (!na || !nb) return false;
  const ta = na.slice(-10);
  const tb = nb.slice(-10);
  return ta === tb || na === nb;
}
