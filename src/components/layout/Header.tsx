"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { BrandLogo } from "@/components/brand/BrandLogo";

const menuLinks = [
  { href: "/#products", label: "المنتجات" },
  { href: "/collections", label: "كل المجموعات" },
  { href: "/collections/bags", label: "مقاطف" },
  { href: "/search", label: "بحث" },
];

export function Header() {
  const totalItems = useCartStore((s) => s.totalItems());
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-page/95 backdrop-blur-sm shadow-header">
      <div className="relative max-w-page mx-auto h-20 sm:h-24 px-4 md:px-8">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-card transition"
          aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={menuOpen}
          aria-controls="store-menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <Link
          href="/"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          aria-label="Muqatshop — الصفحة الرئيسية"
        >
          <BrandLogo size="sm" />
        </Link>

        <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 sm:gap-4">
          <Link href="/search" className="p-2 rounded-lg hover:bg-card transition" aria-label="بحث">
            <Search className="w-6 h-6" strokeWidth={1.5} />
          </Link>
          <Link href="/cart" className="relative p-2 rounded-lg hover:bg-card transition" aria-label="السلة">
            <ShoppingBag className="w-6 h-6" strokeWidth={1.5} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="store-menu"
          className="absolute inset-x-0 top-full border-t border-border bg-page shadow-lg"
          aria-label="القائمة الرئيسية"
        >
          <ul className="max-w-page mx-auto px-4 md:px-8 py-3 grid grid-cols-2 sm:flex sm:items-center sm:gap-8 text-sm font-medium">
            {menuLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-3 hover:bg-card transition"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
