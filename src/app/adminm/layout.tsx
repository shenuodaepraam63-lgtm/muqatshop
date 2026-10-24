"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "muqatshop@gmail.com";

export default function AdminmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || session.user.email !== ADMIN_EMAIL) {
        router.replace("/admin/login?next=/adminm");
        return;
      }
      setOk(true);
    })();
  }, [router]);

  if (!ok) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted">
        جاري التحقق...
      </div>
    );
  }

  const links = [
    { href: "/adminm", label: "نظرة عامة" },
    { href: "/adminm/merchants", label: "التجار" },
    { href: "/adminm/orders", label: "طلبات التجار" },
    { href: "/adminm/withdrawals", label: "السحوبات" },
    { href: "/adminm/messages", label: "رسائل" },
    { href: "/adminm/settings", label: "إعدادات" },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <header className="bg-[#0f2744] text-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold">AdminM · التجار</span>
          <Link href="/admin" className="text-xs opacity-80 hover:opacity-100">
            لوحة المنتجات ←
          </Link>
        </div>
        <nav className="max-w-5xl mx-auto px-2 flex gap-1 overflow-x-auto pb-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full ${
                pathname === l.href ? "bg-white text-[#0f2744]" : "bg-white/15 text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
