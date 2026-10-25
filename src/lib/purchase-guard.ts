"use client";

import { canPurchase, getSiteRole } from "@/lib/role";
import { getCustomerSession } from "@/lib/customer";
import { getMerchantSession } from "@/lib/merchant";

/**
 * true = مسموح بالشراء
 * false = لازم توجيه لتسجيل العميل
 */
export function ensureCanPurchase(): boolean {
  if (getMerchantSession()) return true;
  if (getSiteRole() === "customer" && getCustomerSession()) return true;
  return false;
}

export function purchaseLoginHref(returnTo?: string): string {
  const q = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
  return `/welcome${q}&tab=customer`;
}

export function redirectToCustomerAuth(returnTo?: string) {
  if (typeof window === "undefined") return;
  const base = "/welcome?tab=customer";
  const url = returnTo
    ? `${base}&next=${encodeURIComponent(returnTo)}`
    : base;
  window.location.href = url;
}
