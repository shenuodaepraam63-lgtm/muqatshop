"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getMerchantSession, clearMerchantSession } from "@/lib/merchant";

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuth = pathname === "/merchant/login" || pathname === "/merchant/register";
  const [ready, setReady] = useState(isAuth);
  const [name, setName] = useState("");

  useEffect(() => {
    if (isAuth) {
      setReady(true);
      return;
    }
    const s = getMerchantSession();
    if (!s) {
      router.replace("/merchant/login");
      return;
    }
    setName(s.name);
    setReady(true);
  }, [isAuth, router, pathname]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted text-sm">جاري التحميل...</div>
    );
  }

  if (isAuth) return <>{children}</>;

  const nav = [
    { href: "/merchant", label: "الرئيسية" },
    { href: "/merchant/new-order", label: "طلب جديد" },
    { href: "/merchant/orders", label: "طلباتي" },
    { href: "/merchant/wallet", label: "المحفظة" },
    { href: "/merchant/messages", label: "الرسائل" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <header className="bg-white border-b border-[#e8e2d9] sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-sm">تاجر · {name}</span>
          <button
            type="button"
            className="text-xs text-sale"
            onClick={() => {
              clearMerchantSession();
              router.replace("/merchant/login");
            }}
          >
            خروج
          </button>
        </div>
        <nav className="max-w-3xl mx-auto px-2 flex gap-1 overflow-x-auto pb-2">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full ${
                pathname === n.href ? "bg-ink text-white" : "bg-[#f0ebe3] text-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
