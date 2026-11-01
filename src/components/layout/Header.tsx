"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Heart, Menu, ShoppingBag, User, X } from "lucide-react";
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
import { SearchBar } from "@/components/search/SearchBar";

const navLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/shop", label: "المتجر" },
  { href: "/shop", label: "التصنيفات" },
  { href: "/shop?offers=true", label: "العروض" },
];

export function Header() {
  const totalItems = useCartStore((s) => s.totalItems());
  const wishCount = useWishlistStore((s) => s.items.length);
  const [merchant, setMerchant] = useState<MerchantSession | null>(null);
  const [userLabel, setUserLabel] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);

  const refresh = async () => {
    const legacyMerchant = getMerchantSession();
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (session?.user) {
      const identity = await loadAccountIdentity();
      const isPartner =
        identity.ok &&
        (identity.identity.accountType === "affiliate" ||
          identity.identity.accountType === "supplier");
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

  const accountHref = merchant ? "/merchant" : loggedIn ? "/account" : "/login";

  const logout = async () => {
    setOpen(false);
    await signOutToHome();
  };

  return (
    <header className="relative z-40 border-b border-[#E5EAF1] bg-white text-[#14243A]">
      <div className="mx-auto flex h-[60px] max-w-[1440px] items-center justify-between gap-3 px-[4%] sm:h-[64px]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-[#F6F8FB] md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/" className="shrink-0" aria-label="Muqatshop — الرئيسية">
            <BrandLogo size="sm" tone="navy" className="max-h-11" />
          </Link>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <Link
            href={accountHref}
            className="flex items-center gap-1.5 rounded-lg p-2.5 transition hover:bg-[#F6F8FB] sm:px-3"
            aria-label="الحساب"
          >
            <User className="h-5 w-5" strokeWidth={1.8} />
            <span className="hidden max-w-[120px] truncate text-xs font-semibold sm:inline">
              {loggedIn ? userLabel || "حسابي" : "دخول"}
            </span>
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

      <div className="border-t border-[#E5EAF1] bg-[#F6F8FB]">
        <div className="mx-auto max-w-[1440px] px-[4%] py-2.5">
          <Suspense fallback={<div className="h-12 animate-pulse rounded-[10px] bg-white" />}>
            <SearchBar />
          </Suspense>
        </div>
      </div>

      <div className="hidden border-t border-[#E5EAF1] md:block">
        <nav
          className="mx-auto flex max-w-[1440px] items-center gap-1 px-[4%] py-2 text-sm font-semibold"
          aria-label="أقسام المتجر"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-lg px-3 py-2 text-[#526174] transition hover:bg-[#F6F8FB] hover:text-[#3157D5]"
            >
              {link.label}
            </Link>
          ))}
          {loggedIn && (
            <button
              type="button"
              className="mr-auto rounded-lg px-3 py-2 text-xs font-semibold text-[#D64C4C] hover:bg-red-50"
              onClick={() => void logout()}
            >
              خروج
            </button>
          )}
        </nav>
      </div>

      {open && (
        <div className="border-t border-[#E5EAF1] bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2" aria-label="قائمة الهاتف">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-[#526174] hover:bg-[#F6F8FB]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={accountHref}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-semibold text-[#3157D5] hover:bg-[#EEF3FF]"
            >
              {loggedIn ? "حسابي" : "تسجيل الدخول"}
            </Link>
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
