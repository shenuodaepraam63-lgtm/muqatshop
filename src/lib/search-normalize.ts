/** تطبيع النص العربي/الإنجليزي للمطابقة في البحث */
export function normalizeSearchText(input: string): string {
  let s = (input || "").trim().toLowerCase();
  if (!s) return "";

  // إزالة التشكيل
  s = s.replace(/[\u064B-\u065F\u0670]/g, "");
  // توحيد الألف
  s = s.replace(/[أإآٱ]/g, "ا");
  // الياء والألف المقصورة
  s = s.replace(/ى/g, "ي");
  // التاء المربوطة
  s = s.replace(/ة/g, "ه");
  // مسافات زائدة وعلامات
  s = s.replace(/[_\-–—]+/g, " ");
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

/** مرادفات موثوقة فقط (عربي ↔ إنجليزي) — بدون اختراع عشوائي */
const ALIASES: Record<string, string[]> = {
  bluetooth: ["بلوتوث", "bluetooth"],
  بلوتوث: ["bluetooth", "بلوتوث"],
  laptop: ["لابتوب", "laptop", "notebook"],
  لابتوب: ["laptop", "لابتوب"],
  headphones: ["سماعة", "سماعات", "headphones", "headset"],
  سماعة: ["headphones", "سماعة", "سماعات"],
  سماعات: ["headphones", "سماعة", "سماعات"],
  phone: ["موبايل", "هاتف", "phone", "mobile"],
  موبايل: ["phone", "mobile", "موبايل", "هاتف"],
  watch: ["ساعة", "watch"],
  ساعة: ["watch", "ساعة"],
};

export function expandSearchTerms(query: string): string[] {
  const n = normalizeSearchText(query);
  if (!n) return [];
  const terms = new Set<string>([n, query.trim()]);
  const parts = n.split(" ").filter(Boolean);
  for (const p of parts) {
    terms.add(p);
    const aliases = ALIASES[p];
    if (aliases) aliases.forEach((a) => terms.add(a));
  }
  const fullAliases = ALIASES[n];
  if (fullAliases) fullAliases.forEach((a) => terms.add(a));
  return Array.from(terms).filter(Boolean);
}

export function scoreProductMatch(
  query: string,
  product: { name?: string | null; description?: string | null; brand?: string | null }
): number {
  const q = normalizeSearchText(query);
  if (!q) return 0;
  const name = normalizeSearchText(product.name || "");
  const brand = normalizeSearchText(product.brand || "");
  const desc = normalizeSearchText(product.description || "");

  if (name === q) return 100;
  if (name.startsWith(q)) return 90;
  if (name.includes(q)) return 75;
  if (brand === q || brand.includes(q)) return 55;
  if (desc.includes(q)) return 35;

  // تطابق جزئي بالكلمات
  const qParts = q.split(" ").filter((p) => p.length > 1);
  let partial = 0;
  for (const p of qParts) {
    if (name.includes(p)) partial += 12;
    else if (brand.includes(p)) partial += 6;
    else if (desc.includes(p)) partial += 3;
  }
  return Math.min(partial, 70);
}
