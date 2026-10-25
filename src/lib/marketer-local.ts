/** بيانات محلية لحساب المسوق (صفحات + مفضلة + أسعار البيع) */

export type MarketerPage = {
  id: string;
  name: string;
  note: string;
  created_at: string;
};

const PAGES_KEY = "muqat_marketer_pages";
const FAV_KEY = "muqat_marketer_favorites";
const PRICES_KEY = "muqat_marketer_prices";

export function loadMarketerPages(): MarketerPage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PAGES_KEY);
    return raw ? (JSON.parse(raw) as MarketerPage[]) : [];
  } catch {
    return [];
  }
}

export function saveMarketerPages(list: MarketerPage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PAGES_KEY, JSON.stringify(list));
}

export function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAV_KEY, JSON.stringify(ids));
}

export function toggleFavorite(productId: string): string[] {
  const cur = loadFavorites();
  const next = cur.includes(productId)
    ? cur.filter((id) => id !== productId)
    : [...cur, productId];
  saveFavorites(next);
  return next;
}

export function isFavorite(productId: string): boolean {
  return loadFavorites().includes(productId);
}

/** أسعار البيع: productId → number */
export function loadLocalPrices(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PRICES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function getLocalPrice(productId: string): number | null {
  const n = loadLocalPrices()[productId];
  return typeof n === "number" && !Number.isNaN(n) ? n : null;
}

export function setLocalPrice(productId: string, price: number) {
  if (typeof window === "undefined") return;
  const all = loadLocalPrices();
  all[productId] = price;
  localStorage.setItem(PRICES_KEY, JSON.stringify(all));
}
