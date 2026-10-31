"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSiteRole, setSiteRole } from "@/lib/role";
import { getCustomerSession } from "@/lib/customer";
import { getMerchantSession } from "@/lib/merchant";

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
];

const CUSTOMER_ONLY = [
  "/account",
  "/cart",
  "/checkout",
  "/wishlist",
  "/orders",
];

function isUnder(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(p + "/"));
}

export function RoleGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const path = pathname || "/";
    const isPublic = path === "/" || isUnder(path, PUBLIC_PREFIXES);
    const merchant = getMerchantSession();
    const customer = getCustomerSession();

    if (merchant) {
      setSiteRole("merchant");
      if (isUnder(path, CUSTOMER_ONLY) && !path.startsWith("/account/pending") && !path.startsWith("/account/profile")) {
        router.replace("/merchant");
        return;
      }
      setReady(true);
      return;
    }

    if (customer) {
      setSiteRole("customer");
      if (
        path.startsWith("/merchant") &&
        path !== "/merchant/login" &&
        path !== "/merchant/register" &&
        !path.startsWith("/merchant/login") &&
        !path.startsWith("/merchant/register")
      ) {
        router.replace("/");
        return;
      }
      setReady(true);
      return;
    }

    const role = getSiteRole();
    if (!role && !isPublic) {
      router.replace("/login");
      return;
    }

    if (
      path.startsWith("/merchant") &&
      path !== "/merchant/login" &&
      path !== "/merchant/register"
    ) {
      router.replace("/login");
      return;
    }

    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-sm text-muted bg-page">
        جاري التحميل...
      </div>
    );
  }

  return <>{children}</>;
}
