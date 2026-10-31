"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Settings,
  User,
} from "lucide-react";
import {
  loadAccountIdentity,
  mirrorLegacySession,
  type AccountIdentity,
} from "@/lib/account-identity";
import { clearCustomerSession } from "@/lib/customer";
import { clearSiteRole } from "@/lib/role";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/account", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "طلباتي", icon: Package },
  { href: "/account/addresses", label: "عناويني", icon: MapPin },
  { href: "/account/profile", label: "بياناتي", icon: User },
  { href: "/wishlist", label: "المفضلة", icon: Heart },
  { href: "/account/profile#settings", label: "الإعدادات", icon: Settings },
];

export function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [identity, setIdentity] = useState<AccountIdentity | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await loadAccountIdentity();
      if (cancelled) return;
      if (!res.ok) {
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
  }, [pathname, router]);

  const logout = async () => {
    await supabase.auth.signOut();
    clearCustomerSession();
    clearSiteRole();
    router.replace("/login");
  };

  if (!ready || !identity) {
    return (
      <div className="min-h-[50vh] grid place-items-center bg-[#F6F8FB] text-sm text-[#718096]">
        جاري تحميل الحساب...
      </div>
    );
  }

  const name = identity.fullName || identity.email.split("@")[0];

  return (
    <div className="min-h-screen bg-[#F6F8FB]" dir="rtl">
      <div className="border-b border-[#E4E9F0] bg-white">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-semibold text-[#3157D5]">حساب العميل</p>
            <h1 className="text-base font-bold text-[#14243A] sm:text-lg">مرحبًا، {name}</h1>
          </div>
          <Link
            href="/shop"
            className="rounded-lg border border-[#E4E9F0] px-3 py-2 text-xs font-semibold text-[#14243A] hover:bg-[#F6F8FB] sm:text-sm"
          >
            المتجر
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1100px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-6 space-y-1 rounded-2xl border border-[#E4E9F0] bg-white p-3 shadow-sm">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname === href || pathname?.startsWith(href + "/");
              return (
                <Link
                  key={href + label}
                  href={href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-[#14243A] text-white"
                      : "text-[#526174] hover:bg-[#F6F8FB] hover:text-[#14243A]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
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
          <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {NAV.map(({ href, label, exact }) => {
              const active = exact ? pathname === href : pathname === href || pathname?.startsWith(href + "/");
              return (
                <Link
                  key={href + label}
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
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
