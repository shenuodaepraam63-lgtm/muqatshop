"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useLocale } from "@/lib/locale";

export default function AccountWishlistPage() {
  const { t } = useLocale();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[var(--text)]">{t("wishlist.title")}</h2>
      </div>
      <div className="account-card border-dashed px-4 py-12 text-center">
        <Heart className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" strokeWidth={1.5} />
        <p className="font-semibold text-[var(--text)]">{t("wishlist.empty")}</p>
        <Link
          href="/shop"
          className="mt-4 inline-block text-sm font-bold text-[#3157D5]"
        >
          {t("common.shop")}
        </Link>
      </div>
    </div>
  );
}
