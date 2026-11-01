"use client";

import { supabase } from "@/lib/supabase";
import { getMerchantSession } from "@/lib/merchant";

/**
 * Checkout / protected purchase requires Supabase Auth or legacy merchant session.
 * Guest may keep a local cart; only blocked at checkout or explicit guarded actions.
 */
export async function ensureCanPurchaseAsync(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (getMerchantSession()) return true;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session?.user);
}

/**
 * Synchronous best-effort: merchant session only is NOT enough for customers.
 * Prefer ensureCanPurchaseAsync. Kept for rare sync call sites — always false
 * for pure customers so callers must use async path.
 * @deprecated use ensureCanPurchaseAsync
 */
export function ensureCanPurchase(): boolean {
  if (typeof window === "undefined") return false;
  if (getMerchantSession()) return true;
  // Cannot read async session here reliably — return false to force async path
  // or allow guest cart without this guard.
  return false;
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
