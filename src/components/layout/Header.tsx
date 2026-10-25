"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, Heart, Menu, X, User } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useWishlistStore } from "@/lib/wishlist";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { supabase } from "@/lib/supabase";
import {
  getMerchantSession,
  clearMerchantSession,
  MERCHANT_SESSION_EVENT,
  type MerchantSession,
} from "@/lib/merchant";

export function Header() {
  const totalItems = useCartStore((s) => s.totalItems());
  const wishCount = useWishlistStore((s) => s.items.length);
  const [merchant, setMerchant] = useState<MerchantSession | null>(null);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const refresh = () => {
    const s = getMerchantSession();
    setMerchant(s);
    if (s) {
      supabase
        .from("merchant_messages")
        .select("id", { count: "exact", head: true })
        .eq("merchant_id", s.id)
        .eq("is_read", false)
        .then(({ count }) => setUnread(count || 0));
    } else {
      setUnread(0);
    }
  };

  useEffect(() => {
    refresh();
    window.addEventListener(MERCHANT_SESSION_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(MERCHANT_SESSION_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const mainLinks = [
    { href: "/shop", label: "المتجر" },
    { href: "/groups", label: "الأقسام" },
    { href: "/track", label: "تتبع طلب" },
    { href: "/search", label: "بحث" },
  ];

  const merchantLinks = merchant
    ? [
        { href: "/merchant", label: "لوحتي" },
        { href: "/merchant/orders", label: "طلباتي" },
        { href: "/merchant/wallet", label: "المحفظة" },
        {
          href: "/merchant/messages",
          label: unread > 0 ? `الرسائل (${unread})` : "الرسائل",
        },
        { href: "/merchant/profile", label: "حسابي" },
      ]
    : [{ href: "/merchant/login", label: "دخول تاجر" }];

  return (
    <header className="sticky top-0 z-40 bg-page/95 backdrop-blur-sm shadow-header">
      <div className="max-w-page mx-auto px-4 md:px-8 h-20 sm:h-24 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" className="md:hidden p-2 -mr-2" onClick={() => setOpen((v) => !v)} aria-label="القائمة">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link href="/" className="shrink-0" aria-label="Muqatshop — الصفحة الرئيسية">
            <BrandLogo size="sm" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          {mainLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:opacity-70 transition">{l.label}</Link>
          ))}
          <span className="w-px h-4 bg-border" />
          {merchantLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:opacity-70 transition text-[#0f2744]">{l.label}</Link>
          ))}
          {merchant && (
            <button type="button" className="text-xs text-sale" onClick={() => { clearMerchantSession(); window.location.href = "/"; }}>خروج تاجر</button>
          )}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {merchant && (
            <Link href="/merchant" className="hidden sm:flex items-center gap-1 text-xs font-medium bg-[#0f2744] text-white px-2.5 py-1.5 rounded-full max-w-[120px] truncate relative" title={merchant.name}>
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{merchant.name}</span>
              {unread > 0 && (
                <span className="absolute -top-1 -left-1 bg-sale text-white text-[9px] min-w-[14px] h-3.5 rounded-full flex items-center justify-center px-0.5">{unread}</span>
              )}
            </Link>
          )}
          <Link href="/search" className="p-2 hover:opacity-70 transition" aria-label="بحث"><Search className="w-6 h-6" strokeWidth={1.5} /></Link>
          <Link href="/wishlist" className="relative p-2 hover:opacity-70 transition" aria-label="الأمنيات">
            <Heart className="w-6 h-6" strokeWidth={1.5} />
            {wishCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-sale text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">{wishCount}</span>}
          </Link>
          <Link href="/cart" className="relative p-2 hover:opacity-70 transition" aria-label="السلة">
            <ShoppingBag className="w-6 h-6" strokeWidth={1.5} />
            {totalItems > 0 && <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">{totalItems}</span>}
          </Link>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-page px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-2 text-sm font-medium">
            {mainLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-2.5 border-b border-[#f0ebe3]">{l.label}</Link>
            ))}
            <p className="text-[11px] text-muted pt-3 pb-1">{merchant ? `حساب التاجر · ${merchant.name}` : "التاجر"}</p>
            {merchantLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-2.5 border-b border-[#f0ebe3] text-[#0f2744]">{l.label}</Link>
            ))}
            {merchant && (
              <button type="button" className="py-2.5 text-right text-sale" onClick={() => { clearMerchantSession(); setOpen(false); window.location.href = "/"; }}>خروج تاجر</button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
