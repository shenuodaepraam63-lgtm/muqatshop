"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HorizontalCategoryCarousel } from "@/components/categories/HorizontalCategoryCarousel";
import "@/components/categories/HorizontalCategoryCarousel.css";

export type ShopCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  image?: string | null;
  description?: string | null;
};

export function buildShopUrl(
  base: URLSearchParams,
  patch: Record<string, string | null>
): string {
  const next = new URLSearchParams(base.toString());
  for (const [k, v] of Object.entries(patch)) {
    if (v == null || v === "") next.delete(k);
    else next.set(k, v);
  }
  next.delete("page");
  const q = next.toString();
  return q ? `/shop?${q}` : "/shop";
}

/** شريط تصنيفات رئيسية أفقي — نفس مكوّن الرئيسية */
export function ShopCategoryBar({
  categories,
}: {
  categories: ShopCategory[];
}) {
  const sp = useSearchParams();
  const active = sp.get("category") || "";
  const roots = categories.filter((c) => !c.parent_id);
  if (!roots.length) return null;

  const items = roots.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    image: c.image,
    href: buildShopUrl(sp, { category: c.slug, subcategory: null }),
    active: active === c.slug,
  }));

  return (
    <section className="mb-5" aria-label="التصنيفات الرئيسية">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[#14243A]">التصنيفات</h2>
        {active ? (
          <Link
            href={buildShopUrl(sp, { category: null, subcategory: null })}
            className="text-xs font-semibold text-[#3157D5] hover:underline"
          >
            عرض كل المنتجات
          </Link>
        ) : null}
      </div>

      <HorizontalCategoryCarousel items={items} ariaLabel="تصنيفات المتجر" />
    </section>
  );
}

/** منطقة تعريف التصنيف النشط */
export function ActiveCategoryHeader({
  categories,
  productCount,
}: {
  categories: ShopCategory[];
  productCount: number;
}) {
  const sp = useSearchParams();
  const categorySlug = sp.get("category") || "";
  const subcategorySlug = sp.get("subcategory") || "";
  if (!categorySlug) return null;

  const parent = categories.find((c) => c.slug === categorySlug);
  if (!parent) return null;

  const sub = subcategorySlug
    ? categories.find((c) => c.slug === subcategorySlug && c.parent_id === parent.id)
    : null;

  const kids = categories.filter((c) => c.parent_id === parent.id);
  const title = sub?.name || parent.name;
  const description = sub?.description || parent.description || null;

  return (
    <section
      className="mb-4 flex min-h-[120px] flex-col gap-4 rounded-[12px] border border-[#E5EAF1] bg-white p-4 sm:min-h-[150px] sm:flex-row sm:items-center sm:justify-between sm:rounded-[16px] sm:p-6"
      aria-label="التصنيف النشط"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[#3157D5]">
          {sub ? parent.name : "تصنيف"}
        </p>
        <h2 className="mt-1 text-[22px] font-bold leading-tight text-[#14243A] sm:text-[28px]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-[#718096] sm:text-sm">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex w-full shrink-0 gap-3 sm:w-[220px] sm:flex-col">
        <Stat label="المنتجات" value={String(productCount)} />
        {!sub ? <Stat label="فرعي" value={String(kids.length)} /> : null}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-xl bg-[#F6F8FB] px-3 py-2.5 text-center">
      <p className="text-lg font-bold text-[#14243A]">{value}</p>
      <p className="text-[11px] text-[#718096]">{label}</p>
    </div>
  );
}

/** Chips التصنيفات الفرعية + عرض الكل */
export function ShopSubcategoryBar({
  categories,
  parentSlug,
}: {
  categories: ShopCategory[];
  parentSlug: string;
}) {
  const sp = useSearchParams();
  const [expanded, setExpanded] = useState(false);

  const parent = useMemo(
    () => categories.find((c) => c.slug === parentSlug),
    [categories, parentSlug]
  );
  if (!parent) return null;

  const kids = categories.filter((c) => c.parent_id === parent.id);
  if (!kids.length) return null;

  const active = sp.get("subcategory") || "";
  const visible = expanded ? kids : kids.slice(0, 5);
  const hasMore = kids.length > 5;

  return (
    <section className="mb-4" aria-label="التصنيفات الفرعية">
      <div className="flex flex-wrap gap-2 max-md:flex-nowrap max-md:overflow-x-auto max-md:pb-1 max-md:no-scrollbar">
        <Link
          href={buildShopUrl(sp, { subcategory: null })}
          className={`inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-[13px] font-semibold sm:h-10 sm:px-4 sm:text-sm ${
            !active
              ? "border-[#3157D5] bg-[#3157D5] text-white"
              : "border-[#E5EAF1] bg-white text-[#526174]"
          }`}
        >
          الكل
        </Link>
        {visible.map((c) => {
          const on = active === c.slug;
          return (
            <Link
              key={c.id}
              href={buildShopUrl(sp, {
                category: parent.slug,
                subcategory: c.slug,
              })}
              className={`inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-[13px] font-semibold sm:h-10 sm:px-4 sm:text-sm ${
                on
                  ? "border-[#3157D5] bg-[#3157D5] text-white"
                  : "border-[#E5EAF1] bg-white text-[#526174] hover:border-[#3157D5]"
              }`}
            >
              {c.name}
            </Link>
          );
        })}
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex h-9 shrink-0 items-center rounded-full border border-dashed border-[#3157D5] px-3 text-[13px] font-semibold text-[#3157D5] sm:h-10 sm:px-4 sm:text-sm"
          >
            {expanded ? "إخفاء" : `عرض الكل (${kids.length})`}
          </button>
        )}
      </div>
    </section>
  );
}
