"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, Heart, Menu, X, User } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useWishlistStore } from "@/lib/wishlist";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  getMerchantSession,
  MERCHANT_SESSION_EVENT,
  type MerchantSession,
} from "@/lib/merchant";
import { supabase } from "@/lib/supabase";
import { signOutToHome } from "@/lib/auth-session";
import { loadAccountIdentity } from "@/lib/account-identity";

export function Header() {
  const totalItems = useCartStore((s) => s.totalItems());
  const wishCount = useWishlistStore((s) => s.items.length);
  const [merchant, setMerchant] = useState<MerchantSession | null>(null);
  const [userLabel, setUserLabel] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);

  const refresh = async () => {
    setMerchant(getMerchantSession());
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    setLoggedIn(Boolean(session?.user) || Boolean(getMerchantSession()));
    if (session?.user) {
      const id = await loadAccountIdentity();
      if (id.ok) setUserLabel(id.identity.fullName || id.identity.email.split("@")[0]);
      else setUserLabel(session.user.email?.split("@")[0] || "حسابي");
    } else if (getMerchantSession()) {
      setUserLabel(getMerchantSession()!.name);
    } else {
      setUserLabel(null);
    }
  };

  useEffect(() => {
    refresh();
    window.addEventListener(MERCHANT_SESSION_EVENT, () => {
      void refresh();
    });
    window.addEventListener("focus", () => {
      void refresh();
    });
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => {
      window.removeEventListener(MERCHANT_SESSION_EVENT, () => {
        void refresh();
      });
      window.removeEventListener("focus", () => {
        void refresh();
      });
      sub.subscription.unsubscribe();
    };
  }, []);

  const mainLinks = [
    { href: "/shop", label: "المتجر" },
    { href: "/categories", label: "التصنيفات" },
    { href: "/more", label: "المزيد" },
  ];

  let accountLinks: { href: string; label: string }[] = [];
  if (merchant) {
    accountLinks = [
      { href: "/merchant", label: "بوابة المسوق" },
      { href: "/account/profile", label: "الملف الشخصي" },
    ];
  } else if (loggedIn) {
    accountLinks = [
      { href: "/account", label: "حسابي" },
      { href: "/account/orders", label: "طلباتي" },
      { href: "/account/profile", label: "الملف الشخصي" },
    ];
  } else {
    accountLinks = [
      { href: "/login", label: "دخول" },
      { href: "/register", label: "إنشاء حساب" },
    ];
  }

  const logout = async () => {
    await signOutToHome();
  };

  return (
    <header className="sticky top-0 z-40 bg-page/90 backdrop-blur-md shadow-header border-b border-border/70">
      <div className="max-w-page mx-auto px-4 md:px-8 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="md:hidden p-2 -mr-2 rounded-xl hover:bg-surface-2 transition"
            onClick={() => setOpen((v) => !v)}
            aria-label="القائمة"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link href="/" className="shrink-0" aria-label="Muqatshop">
            <BrandLogo size="sm" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {mainLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 rounded-xl text-ink-soft hover:text-ink hover:bg-surface-2 transition"
            >
              {l.label}
            </Link>
          ))}
          <span className="w-px h-4 bg-border mx-1" />
          {accountLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 rounded-xl text-brand-dark font-semibold hover:bg-surface-2 transition"
            >
              {l.label}
            </Link>
          ))}
          {loggedIn && (
            <button
              type="button"
              className="px-3 py-2 text-xs text-sale hover:bg-red-50 rounded-xl transition"
              onClick={logout}
            >
              خروج
            </button>
          )}
        </nav>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {loggedIn && userLabel && (
            <Link
              href={merchant ? "/merchant" : "/account"}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium bg-ink text-white px-3 py-1.5 rounded-full max-w-[140px] truncate shadow-soft"
              title={userLabel}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{userLabel}</span>
            </Link>
          )}
          <Link href="/search" className="p-2.5 rounded-xl hover:bg-surface-2 transition" aria-label="بحث">
            <Search className="w-5 h-5" strokeWidth={1.5} />
          </Link>
          <Link href="/wishlist" className="relative p-2.5 rounded-xl hover:bg-surface-2 transition" aria-label="الأمنيات">
            <Heart className="w-5 h-5" strokeWidth={1.5} />
            {wishCount > 0 && (
              <span className="absolute top-1 right-1 bg-sale text-white text-[10px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5">
                {wishCount}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative p-2.5 rounded-xl hover:bg-surface-2 transition" aria-label="السلة">
            <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
            {totalItems > 0 && (
              <span className="absolute top-1 right-1 bg-brand text-white text-[10px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-page/98 backdrop-blur-md px-4 pb-4">
          <nav className="flex flex-col gap-0.5 pt-2 text-sm font-medium">
            {mainLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 px-2 rounded-xl border-b border-border/80 hover:bg-surface-2"
              >
                {l.label}
              </Link>
            ))}
            <p className="text-[11px] text-muted pt-3 pb-1 px-2">الحساب</p>
            {accountLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 px-2 rounded-xl border-b border-border/80 text-brand-dark font-semibold"
              >
                {l.label}
              </Link>
            ))}
            {loggedIn && (
              <button
                type="button"
                className="py-3 px-2 text-right text-sale rounded-xl"
                onClick={() => {
                  setOpen(false);
                  void logout();
                }}
              >
                خروج إلى الرئيسية
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
