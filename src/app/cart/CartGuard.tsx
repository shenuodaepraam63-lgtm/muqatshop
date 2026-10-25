"use client";

import { useEffect } from "react";
import { ensureCanPurchase, redirectToCustomerAuth } from "@/lib/purchase-guard";

export function CartGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!ensureCanPurchase()) {
      redirectToCustomerAuth("/cart");
    }
  }, []);

  if (!ensureCanPurchase()) {
    return (
      <div className="max-w-page mx-auto px-4 py-20 text-center text-sm text-muted">
        جاري التحويل لتسجيل الدخول...
      </div>
    );
  }

  return <>{children}</>;
}
