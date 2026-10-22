"use client";

import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function Header() {
  const totalItems = useCartStore((s) => s.totalItems());

  return (
    <header className="sticky top-0 z-40 bg-page/95 backdrop-blur-sm shadow-header">
      <div className="max-w-page mx-auto px-4 md:px-8 h-[73px] flex items-center justify-between">
        <Link href="/" className="shrink-0" aria-label="Muqatshop — الصفحة الرئيسية">
          <BrandLogo size="sm" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/#products" className="hover:opacity-70 transition">
            المنتجات
          </Link>
          <Link href="/search" className="hover:opacity-70 transition">
            بحث
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/search" className="p-2 hover:opacity-70 transition" aria-label="بحث">
            <Search className="w-6 h-6" strokeWidth={1.5} />
          </Link>
          <Link href="/cart" className="relative p-2 hover:opacity-70 transition" aria-label="السلة">
            <ShoppingBag className="w-6 h-6" strokeWidth={1.5} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
