"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Heart,
  FileStack,
  PlusCircle,
  ClipboardList,
  Images,
  BookOpen,
  Wallet,
  Banknote,
  Calculator,
  User,
  Store,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { getMerchantSession, clearMerchantSession } from "@/lib/merchant";

const NAV = [
  { href: "/merchant", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { href: "/merchant/catalog", label: "كتالوج المنتجات", icon: Package },
  { href: "/merchant/favorites", label: "المفضلة", icon: Heart },
  { href: "/merchant/pages", label: "صفحاتي", icon: FileStack },
  { href: "/merchant/new-order", label: "إضافة أوردر", icon: PlusCircle },
  { href: "/merchant/orders", label: "طلباتي", icon: ClipboardList },
  { href: "/merchant/media", label: "الوسائط التسويقية", icon: Images },
  { href: "/merchant/tutorials", label: "شروحات المنصة", icon: BookOpen },
  { href: "/merchant/wallet", label: "الأرباح والمستحقات", icon: Wallet },
  { href: "/merchant/withdrawals", label: "طلبات السحب", icon: Banknote },
  { href: "/merchant/calculator", label: "حاسبة الأرباح", icon: Calculator },
  { href: "/merchant/profile", label: "حسابي", icon: User },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuth =
    pathname === "/merchant/login" || pathname === "/merchant/register";
  const [ready, setReady] = useState(isAuth);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!ready) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-muted text-sm bg-page">
        جاري التحميل...
      </div>
    );
  }

  if (isAuth) return <>{children}</>;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-0.5 p-2">
      {NAV.map((n) => {
        const Icon = n.icon;
        const active = isActive(n.href, n.exact);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
              active
                ? "bg-accent text-white font-medium shadow-sm"
                : "text-ink hover:bg-[#f0ebe3]"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>{n.label}</span>
          </Link>
        );
      })}
      <div className="my-2 border-t border-[#e8e2d9]" />
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-[#f0ebe3]"
      >
        <Store className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        العودة للمتجر العام
      </Link>
      <button
        type="button"
        onClick={() => {
          clearMerchantSession();
          router.replace("/merchant/login");
        }}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-sale hover:bg-red-50 text-right w-full"
      >
        <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        تسجيل الخروج
      </button>
    </nav>
  );

  return (
    <div className="marketer-shell min-h-screen">
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e2d9] shadow-header">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-[11px] text-accent font-semibold tracking-wide">
              بوابة المسوق
            </p>
            <p className="font-semibold text-sm text-ink truncate max-w-[200px]">{name}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-10 h-10 rounded-xl border border-[#e8e2d9] flex items-center justify-center bg-page"
            aria-label="القائمة"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {open && (
          <div className="border-t border-[#e8e2d9] bg-white max-h-[70vh] overflow-y-auto">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        )}
      </header>

      <div className="lg:flex lg:min-h-screen">
        <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-l border-[#e8e2d9] bg-white sticky top-0 h-screen overflow-y-auto shadow-[ -4px_0_24px_rgba(13,13,18,0.03)]">
          <div className="px-4 py-5 border-b border-[#e8e2d9]">
            <p className="text-[11px] font-semibold text-accent tracking-wide">بوابة المسوق</p>
            <p className="font-bold text-ink mt-0.5 truncate">{name}</p>
            <span className="inline-flex mt-2 text-[10px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
              مفعّل
            </span>
          </div>
          <NavLinks />
        </aside>

        <main className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
