"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getMerchantSession,
  clearMerchantSession,
  MERCHANT_SESSION_EVENT,
  type MerchantSession,
} from "@/lib/merchant";

export function MerchantStrip() {
  const [session, setSession] = useState<MerchantSession | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = () => setSession(getMerchantSession());

  useEffect(() => {
    refresh();
    window.addEventListener(MERCHANT_SESSION_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(MERCHANT_SESSION_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  if (!session) return null;

  const code = session.code || session.id.replace(/-/g, "").slice(0, 8).toUpperCase();

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="bg-[#0f2744] text-white text-xs">
      <div className="max-w-page mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <span className="leading-relaxed">
          وضع التاجر · <strong>{session.name}</strong>
          {" · "}
          كودك:{" "}
          <button type="button" onClick={copyCode} className="font-mono underline">
            {code}
          </button>
          {copied && <span className="mr-1 opacity-80">تم النسخ</span>}
          {" — "}ارفع السعر في السلة والفرق لمحفظتك
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/merchant" className="underline opacity-90">
            لوحتي
          </Link>
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
