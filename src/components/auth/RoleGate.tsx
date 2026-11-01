"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { setSiteRole } from "@/lib/role";
import { getMerchantSession } from "@/lib/merchant";
import {
  loadAccountIdentity,
  type AccountIdentity,
} from "@/lib/account-identity";

/** Public storefront + auth pages — no login required. */
const PUBLIC_PREFIXES = [
  "/shop",
  "/categories",
  "/collections",
  "/groups",
  "/products",
  "/product",
  "/search",
  "/cart",
  "/track",
  "/order-success",
  "/try-mug",
  "/welcome",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/merchant/login",
  "/merchant/register",
  "/admin",
  "/adminm",
  "/auth",
  "/account/pending",
  "/affiliate",
  "/supplier",
  "/more",
  "/wishlist",
];

/** Customer account area — requires Supabase Auth (not legacy localStorage). */
const CUSTOMER_ACCOUNT_PREFIXES = ["/account"];

function isUnder(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(p + "/"));
}

function isPublicPath(path: string) {
  return path === "/" || isUnder(path, PUBLIC_PREFIXES);
}

/** Apply chrome role from server identity (never from user-chosen local role). */
function applyChromeRole(identity: AccountIdentity | null, hasMerchantLocal: boolean) {
  if (hasMerchantLocal) {
    setSiteRole("merchant");
    return;
  }
  if (!identity) {
    setSiteRole("guest");
    return;
  }
  if (identity.accountType === "affiliate" || identity.accountType === "supplier") {
    setSiteRole("merchant");
    return;
  }
  setSiteRole("customer");
}

export function RoleGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const path = pathname || "/";
      const merchantLocal = getMerchantSession();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        // Legacy marketer session is only a storefront chrome hint. It must
        // never grant access to, or redirect away from, the customer account.
        applyChromeRole(null, Boolean(merchantLocal));

        // Customer account requires Auth — never legacy muqat_customer_session.
        if (isUnder(path, CUSTOMER_ACCOUNT_PREFIXES) && !path.startsWith("/account/pending")) {
          router.replace(`/login?next=${encodeURIComponent(path)}`);
          return;
        }

        if (
          path.startsWith("/merchant") &&
          path !== "/merchant/login" &&
          path !== "/merchant/register" &&
          !path.startsWith("/merchant/login") &&
          !path.startsWith("/merchant/register")
        ) {
          router.replace("/login");
          return;
        }

        if (!isPublicPath(path) && path !== "/checkout") {
          // Soft: allow unknown public-ish paths; checkout guards itself.
        }

        if (!cancelled) setReady(true);
        return;
      }

      const idRes = await loadAccountIdentity();
      if (cancelled) return;

      if (!idRes.ok) {
        applyChromeRole(null, false);
        if (isUnder(path, CUSTOMER_ACCOUNT_PREFIXES) && !path.startsWith("/account/pending")) {
          router.replace(`/login?next=${encodeURIComponent(path)}`);
          return;
        }
        if (!cancelled) setReady(true);
        return;
      }

      const identity = idRes.identity;
      applyChromeRole(identity, false);

      if (!identity.isActive) {
        router.replace("/login?suspended=1");
        return;
      }

      // Partnership accounts must not use customer shopping account as home when pending.
      if (identity.accountType === "affiliate") {
        const pending =
          identity.affiliateStatus && identity.affiliateStatus !== "approved";
        if (pending && path.startsWith("/merchant") && !path.startsWith("/merchant/login")) {
          router.replace("/account/pending?type=affiliate");
          return;
        }
      }
      if (identity.accountType === "supplier") {
        const pending =
          identity.supplierStatus && identity.supplierStatus !== "approved";
        if (pending && !path.startsWith("/account/pending") && path.startsWith("/supplier")) {
          router.replace("/account/pending?type=supplier");
          return;
        }
      }

      // Authenticated customer should not open marketer portal.
      if (
        identity.accountType === "customer" &&
        path.startsWith("/merchant") &&
        path !== "/merchant/login" &&
        path !== "/merchant/register"
      ) {
        router.replace("/account");
        return;
      }

      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-sm text-[#718096] bg-[#F6F8FB]">
        جاري التحميل...
      </div>
    );
  }

  return <>{children}</>;
}
