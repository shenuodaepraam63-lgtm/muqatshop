import { supabase } from "@/lib/supabase";
import { setSiteRole, type SiteRole } from "@/lib/role";
import { saveMerchantSession } from "@/lib/merchant";

export type AccountType = "customer" | "affiliate" | "supplier" | "admin";

export type AccountIdentity = {
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  accountType: AccountType;
  isActive: boolean;
  affiliateStatus: string | null;
  supplierStatus: string | null;
  customerId: string | null;
  merchantId: string | null;
  merchantCode: string | null;
  authEmailConfirmed: boolean;
};

/** Load role + approval from server (profiles / v_account_identity) — not Local Storage. */
export async function loadAccountIdentity(): Promise<
  { ok: true; identity: AccountIdentity } | { ok: false; error: string }
> {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user?.email) {
    return { ok: false, error: userErr?.message || "لا توجد جلسة" };
  }

  const { data: viewRow, error: viewErr } = await supabase
    .from("v_account_identity")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!viewErr && viewRow) {
    const identity: AccountIdentity = {
      userId: viewRow.user_id,
      email: viewRow.email || user.email,
      fullName: viewRow.full_name,
      phone: viewRow.phone,
      accountType: (viewRow.account_type as AccountType) || "customer",
      isActive: viewRow.profile_active !== false,
      affiliateStatus: viewRow.affiliate_status,
      supplierStatus: viewRow.supplier_status,
      customerId: viewRow.customer_id,
      merchantId: viewRow.merchant_id,
      merchantCode: viewRow.merchant_code,
      authEmailConfirmed: !!viewRow.auth_email_confirmed,
    };
    return { ok: true, identity };
  }

  // Fallback if view not readable: profiles only
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, account_type, is_active, legacy_customer_id, legacy_merchant_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return {
      ok: true,
      identity: {
        userId: profile.id,
        email: user.email,
        fullName: profile.full_name,
        phone: profile.phone,
        accountType: (profile.account_type as AccountType) || "customer",
        isActive: profile.is_active !== false,
        affiliateStatus: null,
        supplierStatus: null,
        customerId: profile.legacy_customer_id,
        merchantId: profile.legacy_merchant_id,
        merchantCode: null,
        authEmailConfirmed: !!user.email_confirmed_at,
      },
    };
  }

  // Trigger may lag: treat as customer until profile appears
  return {
    ok: true,
    identity: {
      userId: user.id,
      email: user.email,
      fullName:
        (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
        user.email.split("@")[0],
      phone:
        typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null,
      accountType: "customer",
      isActive: true,
      affiliateStatus: null,
      supplierStatus: null,
      customerId: null,
      merchantId: null,
      merchantCode: null,
      authEmailConfirmed: !!user.email_confirmed_at,
    },
  };
}

/** Destination after login — based on server identity, not a role chosen on the form. */
export function resolvePostLoginPath(identity: AccountIdentity): string {
  if (!identity.isActive) return "/login?suspended=1";

  switch (identity.accountType) {
    case "admin":
      return "/admin";
    case "affiliate":
      if (identity.affiliateStatus && identity.affiliateStatus !== "approved") {
        return "/account/pending?type=affiliate";
      }
      return "/merchant";
    case "supplier":
      if (identity.supplierStatus && identity.supplierStatus !== "approved") {
        return "/account/pending?type=supplier";
      }
      return "/account/profile";
    case "customer":
    default:
      return "/account";
  }
}

/**
 * Bridge for marketer portal only during transition.
 * Does NOT write legacy muqat_customer_session — customer identity is Auth-only.
 */
export function mirrorLegacySession(identity: AccountIdentity) {
  if (identity.merchantId) {
    saveMerchantSession({
      id: identity.merchantId,
      email: identity.email,
      name: identity.fullName || identity.email.split("@")[0],
      phone: identity.phone,
      code: identity.merchantCode || "",
    });
  }

  let siteRole: SiteRole = "customer";
  if (identity.accountType === "affiliate" || identity.accountType === "supplier") {
    siteRole = "merchant";
  }
  if (identity.accountType === "admin") {
    siteRole = "customer";
  }
  setSiteRole(siteRole);
}
