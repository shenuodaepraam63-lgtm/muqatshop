"use client";

import { getSiteRole } from "@/lib/role";
import { getCustomerSession } from "@/lib/customer";
import { getMerchantSession } from "@/lib/merchant";

export function ensureCanPurchase(): boolean {
  if (getMerchantSession()) return true;
  if (getSiteRole() === "customer" && getCustomerSession()) return true;
  return false;
}

export function purchaseLoginHref(returnTo?: string): string {
  const params = new URLSearchParams({ tab: "customer" });
  if (returnTo) params.set("next", returnTo);
  return `/welcome?${params.toString()}`;
}

export function redirectToCustomerAuth(returnTo?: string) {
  if (typeof window === "undefined") return;
  window.location.href = purchaseLoginHref(returnTo);
}
