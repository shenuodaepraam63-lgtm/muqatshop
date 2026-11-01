"use client";

export type RecentProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  sale_ends_at?: string | null;
  image: string;
  stock?: number | null;
  variants?: { stock: number }[] | null;
};

const KEY = "muqatshop-recently-viewed";
const MAX = 8;

export function readRecentlyViewed(): RecentProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as RecentProduct[];
    if (!Array.isArray(list)) return [];
    return list.slice(0, MAX);
  } catch {
    return [];
  }
}

export function pushRecentlyViewed(item: RecentProduct) {
  if (typeof window === "undefined") return;
  try {
    const prev = readRecentlyViewed().filter((p) => p.id !== item.id);
    const next = [item, ...prev].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}
