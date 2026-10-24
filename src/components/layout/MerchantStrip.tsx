"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMerchantSession, clearMerchantSession } from "@/lib/merchant";

export function MerchantStrip() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const s = getMerchantSession();
    setName(s?.name || null);
  }, []);

  // re-check on focus (after login in another tab)
  useEffect(() => {
    const onFocus = () => {
      const s = getMerchantSession();
      setName(s?.name || null);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (!name) return null;

  return (
    <div className="bg-[#0f2744] text-white text-xs">
      <div className="max-w-page mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <span>
          وضع التاجر · <strong>{name}</strong> — اطلب من المتجر والسعر الأعلى = ربحك
        </span>
        <div className="flex items-center gap-3">
          <Link href="/merchant/wallet" className="underline opacity-90">
            المحفظة
          </Link>
          <Link href="/merchant/orders" className="underline opacity-90">
            طلباتي
          </Link>
          <Link href="/merchant/messages" className="underline opacity-90">
            رسائل
          </Link>
          <button
            type="button"
            className="opacity-80"
            onClick={() => {
              clearMerchantSession();
              setName(null);
              window.location.href = "/";
            }}
          >
            خروج
          </button>
        </div>
      </div>
    </div>
  );
}
