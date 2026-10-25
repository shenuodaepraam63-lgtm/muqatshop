"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSiteRole, setSiteRole } from "@/lib/role";
import { getCustomerSession } from "@/lib/customer";
import { getMerchantSession } from "@/lib/merchant";

const PUBLIC_PREFIXES = [
  "/welcome",
  "/merchant/login",
  "/merchant/register",
  "/admin",
  "/adminm",
  "/auth",
];

/** مسارات خاصة بالعميل فقط — المسوق ما يدخلهاش */
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
    const isPublic = isUnder(path, PUBLIC_PREFIXES);
    const merchant = getMerchantSession();
    const customer = getCustomerSession();

    // —— مسوق مسجّل: دور المسوق فقط، ومنتجاته جوه /merchant ——
    if (merchant) {
      setSiteRole("merchant");

      // يمنع تجربة العميل (سلة / حساب عميل / أمنيات)
      if (isUnder(path, CUSTOMER_ONLY)) {
        router.replace("/merchant");
        return;
      }

      // صفحة منتج المتجر العام → صفحة المنتج داخل بوابة المسوق لو فيه id في query لاحقًا
      // المنتجات تُعرض من /merchant/catalog/[id] فقط
      setReady(true);
      return;
    }

    // —— عميل مسجّل: ممنوع بوابة المسوق (ما عدا login/register) ——
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

    // —— زائر / بدون جلسة ——
    const role = getSiteRole();
    if (!role && !isPublic) {
      router.replace("/welcome");
      return;
    }

    // زائر يحاول يدخل بوابة المسوق الداخلية
    if (
      path.startsWith("/merchant") &&
      path !== "/merchant/login" &&
      path !== "/merchant/register"
    ) {
      router.replace("/merchant/login");
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
