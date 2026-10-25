/** بيانات محلية لحساب المسوق (صفحات + مفضلة) */

export type MarketerPage = {
  id: string;
  name: string;
  note: string;
  created_at: string;
};

const PAGES_KEY = "muqat_marketer_pages";
const FAV_KEY = "muqat_marketer_favorites";

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
