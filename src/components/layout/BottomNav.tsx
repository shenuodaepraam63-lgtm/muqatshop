"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Heart, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useWishlistStore } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/shop", label: "المتجر", icon: LayoutGrid },
  { href: "/account/wishlist", label: "المفضلة", icon: Heart, guestHref: "/wishlist" },
  { href: "/cart", label: "السلة", icon: ShoppingBag },
  { href: "/account", label: "حسابي", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.totalItems());
  const wishCount = useWishlistStore((s) => s.items.length);

  return (
    <nav className="bottom-nav-safe fixed inset-x-0 bottom-0 z-50 border-t border-[#E5EAF1] bg-white/95 backdrop-blur-md md:hidden">
      <div className="flex h-16 items-center justify-around">
        {links.map((item) => {
          const href = item.href;
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/") ||
                (href === "/account/wishlist" && pathname.startsWith("/wishlist"));
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "relative flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-[11px] transition",
                active ? "font-semibold text-[#3157D5]" : "text-[#718096]"
              )}
            >
              <div className="relative">
                <div
                  className={cn(
                    "flex h-8 w-10 items-center justify-center rounded-xl transition",
                    active && "bg-[#EEF3FF]"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.5} />
                </div>
                {href === "/cart" && totalItems > 0 && (
                  <span className="absolute -right-1 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#3157D5] px-0.5 text-[9px] font-bold text-white">
                    {totalItems}
                  </span>
                )}
                {href === "/account/wishlist" && wishCount > 0 && (
                  <span className="absolute -right-1 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#18A999] px-0.5 text-[9px] font-bold text-white">
                    {wishCount}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
