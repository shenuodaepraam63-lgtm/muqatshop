"use client";

export type SiteRole = "guest" | "customer" | "merchant";

const ROLE_KEY = "muqat_site_role";
export const ROLE_EVENT = "muqat-role-change";

export function getSiteRole(): SiteRole | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(ROLE_KEY);
    if (v === "guest" || v === "customer" || v === "merchant") return v;
    return null;
  } catch {
    return null;
  }
}

export function setSiteRole(role: SiteRole) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROLE_KEY, role);
  window.dispatchEvent(new Event(ROLE_EVENT));
}

export function clearSiteRole() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ROLE_KEY);
  window.dispatchEvent(new Event(ROLE_EVENT));
}

/**
 * Soft UI hint only. Real purchase gate is ensureCanPurchaseAsync() (Supabase Auth).
 * Does NOT read legacy muqat_customer_session.
 */
export function canPurchase(): boolean {
  const role = getSiteRole();
  if (role === "guest" || role === null) return false;
  // merchant marketer or authenticated customer chrome role
  return role === "merchant" || role === "customer";
}
