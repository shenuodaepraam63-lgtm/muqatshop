"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  showCategory?: boolean;
  categories?: { slug: string; name: string }[];
  activeCategory?: string;
};

export function ProductFilters({ showCategory, categories = [], activeCategory }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(sp.toString());
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
      const q = next.toString();
      router.push(q ? `${pathname}?${q}` : pathname);
    },
    [router, pathname, sp]
  );

  const sort = sp.get("sort") || "new";
  const stock = sp.get("stock") || "all";
  const type = sp.get("type") || "all";

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {showCategory && categories.length > 0 && (
        <select
          value={activeCategory || "all"}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "all") router.push("/shop");
            else router.push(`/categories/${v}`);
          }}
          className="text-sm border border-[#e8e2d9] rounded-full px-3 py-2 bg-white"
        >
          <option value="all">كل الأقسام</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      <select
        value={type}
        onChange={(e) => setParam("type", e.target.value)}
        className="text-sm border border-[#e8e2d9] rounded-full px-3 py-2 bg-white"
      >
        <option value="all">كل الأنواع</option>
        <option value="clothing">ملابس</option>
        <option value="mug">مجات</option>
        <option value="general">عام</option>
      </select>

      <select
        value={stock}
        onChange={(e) => setParam("stock", e.target.value)}
        className="text-sm border border-[#e8e2d9] rounded-full px-3 py-2 bg-white"
      >
        <option value="all">الكل</option>
        <option value="in">متوفر فقط</option>
      </select>

      <select
        value={sort}
        onChange={(e) => setParam("sort", e.target.value)}
        className="text-sm border border-[#e8e2d9] rounded-full px-3 py-2 bg-white"
      >
        <option value="new">الأحدث</option>
        <option value="price_asc">السعر: الأقل</option>
        <option value="price_desc">السعر: الأعلى</option>
        <option value="name">الاسم</option>
      </select>
    </div>
  );
}
