"use client";

const REF_KEY = "muqat_merchant_ref";

export type MerchantRef = {
  code: string;
  merchantId: string;
  name?: string;
  savedAt: number;
};

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function saveMerchantRef(ref: Omit<MerchantRef, "savedAt">) {
  if (typeof window === "undefined") return;
  const data: MerchantRef = { ...ref, savedAt: Date.now() };
  localStorage.setItem(REF_KEY, JSON.stringify(data));
}

export function getMerchantRef(): MerchantRef | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as MerchantRef;
    if (!data.code || !data.merchantId) return null;
    if (Date.now() - (data.savedAt || 0) > MAX_AGE_MS) {
      localStorage.removeItem(REF_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearMerchantRef() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REF_KEY);
}

export function merchantShareUrl(code: string, path = "/shop"): string {
  if (typeof window === "undefined") return path;
  const base = window.location.origin;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}?m=${encodeURIComponent(code)}`;
}
