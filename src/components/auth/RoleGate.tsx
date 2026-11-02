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
import { CartPageSkeleton, StorePageSkeleton } from "@/components/ui/StorePageSkeleton";

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
  "/checkout",
];

const CUSTOMER_ACCOUNT_PREFIXES = ["/account"];

function isUnder(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(p + "/"));
}

function isPublicPath(path: string) {
  return path === "/" || isUnder(path, PUBLIC_PREFIXES);
}

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
  const path = pathname || "/";
  const publicPath = isPublicPath(path);

  // Public storefront never blocks first paint — auth runs in background.
  const [ready, setReady] = useState(publicPath);

  useEffect(() => {
    let cancelled = false;
    const current = pathname || "/";
    const isPublic = isPublicPath(current);

    // Show content immediately on public routes
    if (isPublic) setReady(true);
    else setReady(false);

    (async () => {
      const merchantLocal = getMerchantSession();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        applyChromeRole(null, Boolean(merchantLocal));

        if (
          isUnder(current, CUSTOMER_ACCOUNT_PREFIXES) &&
          !current.startsWith("/account/pending")
        ) {
          router.replace(`/login?next=${encodeURIComponent(current)}`);
          return;
        }

        if (
          current.startsWith("/merchant") &&
          current !== "/merchant/login" &&
          current !== "/merchant/register" &&
          !current.startsWith("/merchant/login") &&
          !current.startsWith("/merchant/register")
        ) {
          router.replace("/login");
          return;
        }

        if (!cancelled) setReady(true);
        return;
      }

      const idRes = await loadAccountIdentity();
      if (cancelled) return;

      if (!idRes.ok) {
        applyChromeRole(null, false);
        if (
          isUnder(current, CUSTOMER_ACCOUNT_PREFIXES) &&
          !current.startsWith("/account/pending")
        ) {
          router.replace(`/login?next=${encodeURIComponent(current)}`);
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

      if (identity.accountType === "affiliate") {
        const pending =
          identity.affiliateStatus && identity.affiliateStatus !== "approved";
        if (
          pending &&
          current.startsWith("/merchant") &&
          !current.startsWith("/merchant/login")
        ) {
          router.replace("/account/pending?type=affiliate");
          return;
        }
      }
      if (identity.accountType === "supplier") {
        const pending =
          identity.supplierStatus && identity.supplierStatus !== "approved";
        if (
          pending &&
          !current.startsWith("/account/pending") &&
          current.startsWith("/supplier")
        ) {
          router.replace("/account/pending?type=supplier");
          return;
        }
      }

      if (
        identity.accountType === "customer" &&
        current.startsWith("/merchant") &&
        current !== "/merchant/login" &&
        current !== "/merchant/register"
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
    if (path.startsWith("/cart")) return <CartPageSkeleton />;
    return <StorePageSkeleton />;
  }

  return <>{children}</>;
}
