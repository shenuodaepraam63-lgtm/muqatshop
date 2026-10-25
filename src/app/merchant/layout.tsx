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
      <div className="min-h-[40vh] flex items-center justify-center text-muted text-sm">
        جاري التحميل...
      </div>
    );
  }

  if (isAuth) return <>{children}</>;

  const nav = [
    { href: "/merchant", label: "الرئيسية" },
    { href: "/merchant/catalog", label: "الكتالوج" },
    { href: "/merchant/orders", label: "طلباتي" },
    { href: "/merchant/wallet", label: "المحفظة" },
    { href: "/merchant/messages", label: "الرسائل" },
    { href: "/merchant/profile", label: "حسابي" },
  ];

  return (
    <div className="min-h-[50vh]">
      <div className="bg-[#0f2744]/5 border-b border-[#e8e2d9]">
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between text-sm">
          <span className="font-medium">تاجر · {name}</span>
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
          {nav.map((n) => {
            const active =
              n.href === "/merchant"
                ? pathname === "/merchant"
                : pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full ${
                  active ? "bg-ink text-white" : "bg-[#f0ebe3] text-ink"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
