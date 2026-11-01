"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  Heart,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPin,
  Package,
  Settings,
  ShoppingBag,
  Store,
  User,
} from "lucide-react";
import {
  loadAccountIdentity,
  mirrorLegacySession,
  type AccountIdentity,
} from "@/lib/account-identity";
import { signOutToHome } from "@/lib/auth-session";
import { useCartStore } from "@/lib/store";

const NAV = [
  { href: "/account", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "طلباتي", icon: Package },
  { href: "/account/addresses", label: "عناويني", icon: MapPin },
  { href: "/account/profile", label: "بياناتي الشخصية", icon: User },
  { href: "/account/wishlist", label: "المفضلة", icon: Heart },
  { href: "/account/notifications", label: "الإشعارات", icon: Bell },
  { href: "/account/support", label: "الدعم والمساعدة", icon: LifeBuoy },
  { href: "/account/settings", label: "إعدادات الحساب", icon: Settings },
] as const;

function isNavActive(pathname: string | null, href: string, exact?: boolean) {
  if (!pathname) return false;
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [identity, setIdentity] = useState<AccountIdentity | null>(null);
  const [ready, setReady] = useState(false);
  const cartCount = useCartStore((s) => s.totalItems());

  const isPending = Boolean(pathname?.startsWith("/account/pending"));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await loadAccountIdentity();
      if (cancelled) return;
      if (!res.ok) {
        if (isPending) {
          setReady(true);
          return;
        }
        router.replace(`/login?next=${encodeURIComponent(pathname || "/account")}`);
        return;
      }
      mirrorLegacySession(res.identity);
      setIdentity(res.identity);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, router, isPending]);

  const logout = async () => {
    await signOutToHome();
  };

  if (isPending) {
    if (!ready) {
      return (
        <div className="min-h-[50vh] grid place-items-center bg-[#F6F8FB] text-sm text-[#718096]">
          جاري التحميل...
        </div>
      );
    }
    return <>{children}</>;
  }

  if (!ready || !identity) {
    return (
      <div className="min-h-[50vh] grid place-items-center bg-[#F6F8FB] text-sm text-[#718096]">
        جاري تحميل الحساب...
      </div>
    );
  }

  const name = identity.fullName || identity.email.split("@")[0];
  const pageTitle =
    NAV.find((n) => isNavActive(pathname, n.href, "exact" in n && n.exact))?.label ||
    "حسابي";

  return (
    <div
      className="min-h-screen bg-[#F6F8FB] text-[#202B3C]"
      dir="rtl"
      style={{ fontFamily: "var(--font-cairo), var(--font-inter), system-ui, sans-serif" }}
    >
      <header className="border-b border-[#E4E9F0] bg-white">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#3157D5]">حساب العميل</p>
            <h1 className="truncate text-base font-bold text-[#14243A] sm:text-lg">
              مرحبًا، {name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1 rounded-lg border border-[#E5EAF1] px-2.5 py-1.5 text-xs font-semibold text-[#526174] hover:border-[#3157D5] hover:text-[#3157D5]"
            >
              <Store className="h-3.5 w-3.5" />
              المتجر
            </Link>
            <Link
              href="/cart"
              className="relative inline-flex items-center gap-1 rounded-lg border border-[#E5EAF1] px-2.5 py-1.5 text-xs font-semibold text-[#526174] hover:border-[#3157D5] hover:text-[#3157D5]"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              السلة
              {cartCount > 0 && (
                <span className="absolute -left-1 -top-1 min-w-4 rounded-full bg-[#3157D5] px-1 text-center text-[10px] font-bold leading-4 text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <p className="hidden text-xs font-semibold text-[#718096] sm:block">{pageTitle}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1100px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-6 space-y-1 rounded-2xl border border-[#E4E9F0] bg-white p-3 shadow-sm">
            {NAV.map(({ href, label, icon: Icon, ...rest }) => {
              const exact = "exact" in rest && rest.exact;
              const active = isNavActive(pathname, href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-[#14243A] text-white"
                      : "text-[#526174] hover:bg-[#F6F8FB] hover:text-[#14243A]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#D64C4C] hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </button>
          </nav>
        </aside>

        <div className="min-w-0 space-y-4">
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="أقسام الحساب">
            {NAV.map(({ href, label, ...rest }) => {
              const exact = "exact" in rest && rest.exact;
              const active = isNavActive(pathname, href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    active
                      ? "border-[#14243A] bg-[#14243A] text-white"
                      : "border-[#E4E9F0] bg-white text-[#526174]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={logout}
              className="shrink-0 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-[#D64C4C]"
            >
              خروج
            </button>
          </nav>
          {children}
        </div>
      </div>
    </div>
  );
}
