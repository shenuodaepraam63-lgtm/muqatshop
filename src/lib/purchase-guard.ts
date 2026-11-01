"use client";

import { supabase } from "@/lib/supabase";
import { getMerchantSession } from "@/lib/merchant";

/** Checkout requires Supabase session (or legacy merchant marketer session). Guest cart is allowed. */
export async function ensureCanPurchaseAsync(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (getMerchantSession()) return true;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session?.user);
}

/** @deprecated prefer ensureCanPurchaseAsync — sync check only for merchant marketer path */
export function ensureCanPurchase(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(getMerchantSession());
}

export function purchaseLoginHref(returnTo?: string): string {
  const params = new URLSearchParams();
  if (returnTo) params.set("next", returnTo);
  const q = params.toString();
  return q ? `/login?${q}` : "/login";
}

export function redirectToCustomerAuth(returnTo?: string) {
  if (typeof window === "undefined") return;
  window.location.href = purchaseLoginHref(returnTo);
}
