"use client";

import { supabase } from "@/lib/supabase";
import { clearCustomerSession } from "@/lib/customer";
import { clearMerchantSession } from "@/lib/merchant";
import { clearSiteRole } from "@/lib/role";

/** Full sign-out: Auth session + legacy local sessions. Does not delete account data. */
export async function signOutEverywhere(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore network errors on sign-out
  }
  try {
    clearCustomerSession();
  } catch {
    /* */
  }
  try {
    clearMerchantSession();
  } catch {
    /* */
  }
  try {
    clearSiteRole();
  } catch {
    /* */
  }
}

/** Sign out and land on the storefront home. */
export async function signOutToHome(): Promise<void> {
  await signOutEverywhere();
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}
