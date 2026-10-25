/** تنظيف وعرض بيانات المنتج (إخفاء حشو أمازون + مسافات) */

const JUNK_LABEL =
  /asin|أفضل مبيعا|شاهد أفضل|best.?sellers?|rank|#\s*\d|تصنيف الأفضل|customer reviews|تقييمات العملاء|date first available|تاريخ أول|manufacturer part|item model|رقم الطراز|upc|ean|isbn/i;

const JUNK_VALUE =
  /B0[A-Z0-9]{8,}|شاهد أفضل\s*100|#\s*[\d٬,]+\s*في\s*Electronics/i;

export function isJunkSpecRow(label: string, value: string): boolean {
  const l = (label || "").trim();
  const v = (value || "").trim();
  if (!l && !v) return true;
  if (JUNK_LABEL.test(l) || JUNK_LABEL.test(v)) return true;
  if (JUNK_VALUE.test(v) || JUNK_VALUE.test(l)) return true;
  return false;
}

/** يفصل كلمات ملتصقة شائعة: نوع الموصلUSB → نوع الموصل USB */
export function softSpaceText(s: string): string {
  return (s || "")
    .replace(/([\u0600-\u06FF])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([A-Za-z0-9])([\u0600-\u06FF])/g, "$1 $2")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export type SpecRow = { label: string; value: string };

export function cleanSpecRows(
  rows: { label?: string; value?: string }[] | null | undefined
): SpecRow[] {
  if (!rows?.length) return [];
  return rows
    .map((r) => ({
      label: softSpaceText(r.label || ""),
      value: softSpaceText(r.value || ""),
    }))
    .filter((r) => r.label || r.value)
    .filter((r) => !isJunkSpecRow(r.label, r.value));
}

export function looksLikeLongDump(text: string): boolean {
  const t = (text || "").trim();
  return t.length > 320 || (t.match(/[\.،]/g) || []).length > 4;
}
