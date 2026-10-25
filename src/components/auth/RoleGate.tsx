"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSiteRole, getCustomerSession } from "@/lib/role";
import { getCustomerSession as getCust } from "@/lib/customer";
import { getMerchantSession } from "@/lib/merchant";
import { setSiteRole } from "@/lib/role";

const PUBLIC_PREFIXES = [
  "/welcome",
  "/merchant/login",
  "/merchant/register",
  "/admin",
  "/adminm",
];

export function RoleGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const path = pathname || "/";
    const isPublic = PUBLIC_PREFIXES.some(
      (p) => path === p || path.startsWith(p + "/")
    );

    // مزامنة الدور من الجلسات الموجودة
    if (getMerchantSession()) {
      setSiteRole("merchant");
      setReady(true);
      return;
    }
    if (getCust()) {
      setSiteRole("customer");
      setReady(true);
      return;
    }

    const role = getSiteRole();
    if (!role && !isPublic) {
      router.replace("/welcome");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-sm text-muted">
        جاري التحميل...
      </div>
    );
  }

  return <>{children}</>;
}
