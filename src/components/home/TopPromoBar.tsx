import Link from "next/link";

/**
 * Fixed-style top strip inspired by electronics marketplaces (e.g. installment promo).
 * Muqatshop brand: navy/teal — no fake partner claims.
 */
export function TopPromoBar() {
  return (
    <div
      className="top-promo-bar relative z-50 overflow-hidden text-white"
      role="region"
      aria-label="عرض ترويجي"
    >
      <div className="top-promo-bar__inner mx-auto flex max-w-[1600px] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-[4%] py-2 text-center text-[12px] font-bold sm:text-[13px]">
        <span className="inline-flex items-center gap-2">
          <span className="top-promo-bar__pulse" aria-hidden />
          توصيل سريع · أسعار واضحة · منتجات حقيقية فقط
        </span>
        <span className="hidden text-white/50 sm:inline" aria-hidden>
          |
        </span>
        <Link
          href="/shop?offers=true"
          className="underline decoration-white/40 underline-offset-2 transition hover:decoration-white"
        >
          تسوق العروض الآن
        </Link>
      </div>
    </div>
  );
}
