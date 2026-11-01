"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
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

const mainLinks = [
  { href: "/shop", label: "المنتجات" },
  { href: "/categories", label: "التصنيفات" },
  { href: "/more", label: "المزيد" },
];

export function Header() {
  const totalItems = useCartStore((s) => s.totalItems());
  const wishCount = useWishlistStore((s) => s.items.length);
  const [merchant, setMerchant] = useState<MerchantSession | null>(null);
  const [userLabel, setUserLabel] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);

  const refresh = async () => {
    const legacyMerchant = getMerchantSession();
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (session?.user) {
      const identity = await loadAccountIdentity();
      const isPartner =
        identity.ok &&
        (identity.identity.accountType === "affiliate" || identity.identity.accountType === "supplier");
      setMerchant(isPartner ? legacyMerchant : null);
      setLoggedIn(true);
      setUserLabel(
        identity.ok
          ? identity.identity.fullName || identity.identity.email.split("@")[0]
          : session.user.email?.split("@")[0] || "حسابي"
      );
    } else {
      setMerchant(legacyMerchant);
      setLoggedIn(Boolean(legacyMerchant));
      setUserLabel(legacyMerchant?.name || null);
    }
  };

  useEffect(() => {
    void refresh();

    const onMerchantSession = () => void refresh();
    const onFocus = () => void refresh();
    window.addEventListener(MERCHANT_SESSION_EVENT, onMerchantSession);
    window.addEventListener("focus", onFocus);
    const { data: subscription } = supabase.auth.onAuthStateChange(() => void refresh());

    return () => {
      window.removeEventListener(MERCHANT_SESSION_EVENT, onMerchantSession);
      window.removeEventListener("focus", onFocus);
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const nextY = window.scrollY;
      if (nextY < 12 || nextY < lastY) setVisible(true);
      else if (nextY > lastY + 4) setVisible(false);
      lastY = nextY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const accountLinks = merchant
    ? [
        { href: "/merchant", label: "بوابة الشريك" },
        { href: "/account/profile", label: "الملف الشخصي" },
      ]
    : loggedIn
      ? [
          { href: "/account", label: "حسابي" },
          { href: "/account/orders", label: "طلباتي" },
        ]
      : [
          { href: "/login", label: "تسجيل الدخول" },
          { href: "/register", label: "إنشاء حساب" },
        ];

  const logout = async () => {
    setOpen(false);
    await signOutToHome();
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b border-[#E4E9F0] bg-white/95 text-[#14243A] backdrop-blur-md transition-transform duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between gap-3 px-4 sm:h-[76px] sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-[#F6F8FB] md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/" className="shrink-0" aria-label="Muqatshop — الرئيسية">
            <BrandLogo size="sm" tone="navy" className="max-h-12" />
          </Link>
        </div>

        <nav className="hidden items-center gap-1 text-sm font-semibold lg:flex" aria-label="القائمة الرئيسية">
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-[#526174] transition hover:bg-[#F6F8FB] hover:text-[#3157D5]"
            >
              {link.label}
            </Link>
          ))}
          <span className="mx-2 h-5 w-px bg-[#E4E9F0]" aria-hidden="true" />
          {accountLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-[#3157D5] transition hover:bg-[#EEF3FF]"
            >
              {link.label}
            </Link>
          ))}
          {loggedIn && (
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-xs font-semibold text-[#D64C4C] transition hover:bg-red-50"
              onClick={() => void logout()}
            >
              خروج
            </button>
          )}
        </nav>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {loggedIn && userLabel && (
            <Link
              href={merchant ? "/merchant" : "/account"}
              className="hidden max-w-[150px] items-center gap-1.5 truncate rounded-full bg-[#14243A] px-3 py-1.5 text-xs font-semibold text-white sm:flex"
              title={userLabel}
            >
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{userLabel}</span>
            </Link>
          )}
          <Link href="/search" className="rounded-lg p-2.5 transition hover:bg-[#F6F8FB]" aria-label="بحث">
            <Search className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <Link
            href={loggedIn ? "/account/wishlist" : "/wishlist"}
            className="relative rounded-lg p-2.5 transition hover:bg-[#F6F8FB]"
            aria-label="المفضلة"
          >
            <Heart className="h-5 w-5" strokeWidth={1.8} />
            {wishCount > 0 && (
              <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-[#18A999] px-1 text-center text-[10px] font-bold leading-4 text-white">
                {wishCount}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative rounded-lg p-2.5 transition hover:bg-[#F6F8FB]" aria-label="السلة">
            <ShoppingBag className="h-5 w-5" strokeWidth={1.8} />
            {totalItems > 0 && (
              <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-[#3157D5] px-1 text-center text-[10px] font-bold leading-4 text-white">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#E4E9F0] bg-white px-4 pb-4 md:hidden">
          <nav className="mx-auto flex max-w-[1280px] flex-col gap-1 pt-2" aria-label="قائمة الهاتف">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-[#526174] hover:bg-[#F6F8FB]"
              >
                {link.label}
              </Link>
            ))}
            <p className="px-3 pb-1 pt-3 text-[11px] font-semibold text-[#718096]">الحساب</p>
            {accountLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-[#3157D5] hover:bg-[#EEF3FF]"
              >
                {link.label}
              </Link>
            ))}
            {loggedIn && (
              <button
                type="button"
                className="rounded-lg px-3 py-3 text-right text-sm font-semibold text-[#D64C4C] hover:bg-red-50"
                onClick={() => void logout()}
              >
                تسجيل الخروج
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
