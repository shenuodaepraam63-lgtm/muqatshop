import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency = "EGP") {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/** خصم فعّال فقط لو فيه سعر قبل الخصم أعلى، والمدة لسه ما خلصتش */
export function isSaleActive(
  price: number,
  compareAt: number | null | undefined,
  saleEndsAt?: string | null
): boolean {
  if (compareAt == null || !(compareAt > price)) return false;
  if (!saleEndsAt) return true; // بدون مدة = خصم مستمر
  const end = new Date(saleEndsAt).getTime();
  if (Number.isNaN(end)) return false;
  return end > Date.now();
}

export function salePercent(
  price: number,
  compareAt: number
): number {
  if (!(compareAt > price)) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
