"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, LayoutGrid, Layers, MoreHorizontal } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/shop", label: "المتجر", icon: LayoutGrid },
  { href: "/categories", label: "التصنيفات", icon: Layers },
  { href: "/more", label: "المزيد", icon: MoreHorizontal },
  { href: "/cart", label: "السلة", icon: ShoppingBag },
];

export function BottomNav() {
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.totalItems());

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-page border-t border-border bottom-nav-safe">
      <div className="flex items-center justify-around h-16">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] relative",
                active ? "text-ink font-semibold" : "text-muted"
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2 : 1.5} />
                {href === "/cart" && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-accent text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5">
                    {totalItems}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
