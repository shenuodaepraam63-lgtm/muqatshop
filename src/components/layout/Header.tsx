"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, Heart, Menu, X, User } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useWishlistStore } from "@/lib/wishlist";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  getMerchantSession,
  clearMerchantSession,
  MERCHANT_SESSION_EVENT,
  type MerchantSession,
} from "@/lib/merchant";
import {
  getCustomerSession,
  clearCustomerSession,
  CUSTOMER_SESSION_EVENT,
  type CustomerSession,
} from "@/lib/customer";
import { clearSiteRole } from "@/lib/role";

export function Header() {
  const totalItems = useCartStore((s) => s.totalItems());
  const wishCount = useWishlistStore((s) => s.items.length);
  const [merchant, setMerchant] = useState<MerchantSession | null>(null);
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = () => {
    setMerchant(getMerchantSession());
    setCustomer(getCustomerSession());
  };

  useEffect(() => {
    refresh();
    window.addEventListener(MERCHANT_SESSION_EVENT, refresh);
    window.addEventListener(CUSTOMER_SESSION_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(MERCHANT_SESSION_EVENT, refresh);
      window.removeEventListener(CUSTOMER_SESSION_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const mainLinks = [
    { href: "/shop", label: "المتجر" },
    { href: "/categories", label: "التصنيفات" },
    { href: "/more", label: "المزيد" },
  ];

  let accountLinks: { href: string; label: string }[] = [];
  if (merchant) {
    /* من المتجر العام: اختصار واحد لبوابة المسوق */
    accountLinks = [{ href: "/merchant", label: "بوابة المسوق" }];
  } else if (customer) {
    accountLinks = [{ href: "/account", label: "حسابي" }];
  } else {
    accountLinks = [{ href: "/welcome", label: "دخول" }];
  }

  const logout = () => {
    if (merchant) clearMerchantSession();
    if (customer) clearCustomerSession();
    clearSiteRole();
    window.location.href = "/welcome";
  };

  return (
    <header className="sticky top-0 z-40 bg-page/95 backdrop-blur-sm shadow-header">
      <div className="max-w-page mx-auto px-4 md:px-8 h-20 sm:h-24 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="md:hidden p-2 -mr-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="القائمة"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link href="/" className="shrink-0" aria-label="Muqatshop">
            <BrandLogo size="sm" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          {mainLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:opacity-70 transition">
              {l.label}
            </Link>
          ))}
          <span className="w-px h-4 bg-border" />
          {accountLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:opacity-70 transition text-[#0f2744]"
            >
              {l.label}
            </Link>
          ))}
          {(merchant || customer) && (
            <button type="button" className="text-xs text-sale" onClick={logout}>
              خروج
            </button>
          )}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {(merchant || customer) && (
            <Link
              href={merchant ? "/merchant" : "/account"}
              className="hidden sm:flex items-center gap-1 text-xs font-medium bg-[#0f2744] text-white px-2.5 py-1.5 rounded-full max-w-[140px] truncate"
              title={merchant?.name || customer?.name}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{merchant?.name || customer?.name}</span>
            </Link>
          )}
          <Link href="/search" className="p-2 hover:opacity-70 transition" aria-label="بحث">
            <Search className="w-6 h-6" strokeWidth={1.5} />
          </Link>
          <Link
            href="/wishlist"
            className="relative p-2 hover:opacity-70 transition"
            aria-label="الأمنيات"
          >
            <Heart className="w-6 h-6" strokeWidth={1.5} />
            {wishCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-sale text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                {wishCount}
              </span>
            )}
          </Link>
          <Link
            href="/cart"
            className="relative p-2 hover:opacity-70 transition"
            aria-label="السلة"
          >
            <ShoppingBag className="w-6 h-6" strokeWidth={1.5} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-page px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-2 text-sm font-medium">
            {mainLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2.5 border-b border-[#f0ebe3]"
              >
                {l.label}
              </Link>
            ))}
            <p className="text-[11px] text-muted pt-3 pb-1">الحساب</p>
            {accountLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2.5 border-b border-[#f0ebe3] text-[#0f2744]"
              >
                {l.label}
              </Link>
            ))}
            {(merchant || customer) && (
              <button
                type="button"
                className="py-2.5 text-right text-sale"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
              >
                خروج
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
