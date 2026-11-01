"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

export function ShopToolbar({
  total,
  onOpenFilters,
}: {
  total: number;
  onOpenFilters?: () => void;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const hasQuery = Boolean(sp.get("q")?.trim());
  const sort = sp.get("sort") || (hasQuery ? "relevance" : "new");

  const SORTS = hasQuery
    ? [
        { value: "relevance", label: "الأكثر صلة" },
        { value: "new", label: "الأحدث" },
        { value: "price_asc", label: "السعر ↑" },
        { value: "price_desc", label: "السعر ↓" },
        { value: "discount", label: "أكبر خصم" },
      ]
    : [
        { value: "new", label: "الأحدث" },
        { value: "price_asc", label: "السعر ↑" },
        { value: "price_desc", label: "السعر ↓" },
        { value: "discount", label: "أكبر خصم" },
      ];

  const setSort = (value: string) => {
    const next = new URLSearchParams(sp.toString());
    if (!value || value === (hasQuery ? "relevance" : "new")) next.delete("sort");
    else next.set("sort", value);
    next.delete("page");
    const q = next.toString();
    router.push(q ? `/shop?${q}` : "/shop");
  };

  return (
    <div className="mb-4 flex min-h-[52px] flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E5EAF1] bg-white px-3 py-2 max-md:min-h-[44px]">
      <p className="text-[13px] text-[#718096] max-md:text-xs">
        <span className="font-bold text-[#14243A]">{total}</span> منتج
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onOpenFilters}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5EAF1] px-3 py-2 text-xs font-semibold text-[#14243A] lg:hidden"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          فلاتر
        </button>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-[38px] rounded-lg border border-[#E5EAF1] bg-white px-3.5 text-[13px] font-semibold text-[#14243A] outline-none max-md:h-9 max-md:px-2.5 max-md:text-xs"
          aria-label="ترتيب المنتجات"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
