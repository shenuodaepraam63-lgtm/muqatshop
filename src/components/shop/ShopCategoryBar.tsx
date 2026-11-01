"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export type ShopCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
};

function buildUrl(
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

export function ShopCategoryBar({
  categories,
}: {
  categories: ShopCategory[];
}) {
  const sp = useSearchParams();
  const active = sp.get("category") || "";
  const roots = categories.filter((c) => !c.parent_id);
  const visible = roots.slice(0, 12);

  return (
    <div className="mb-4">
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <Link
          href={buildUrl(sp, { category: null, subcategory: null })}
          className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
            !active
              ? "border-[#3157D5] bg-[#3157D5] text-white"
              : "border-[#E5EAF1] bg-white text-[#526174] hover:border-[#3157D5]"
          }`}
        >
          الكل
        </Link>
        {visible.map((c) => {
          const on = active === c.slug;
          return (
            <Link
              key={c.id}
              href={buildUrl(sp, { category: c.slug, subcategory: null })}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                on
                  ? "border-[#3157D5] bg-[#3157D5] text-white"
                  : "border-[#E5EAF1] bg-white text-[#526174] hover:border-[#3157D5]"
              }`}
            >
              {c.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function ShopSubcategoryBar({
  categories,
  parentSlug,
}: {
  categories: ShopCategory[];
  parentSlug: string;
}) {
  const sp = useSearchParams();
  const parent = categories.find((c) => c.slug === parentSlug);
  if (!parent) return null;
  const kids = categories.filter((c) => c.parent_id === parent.id);
  if (!kids.length) return null;
  const active = sp.get("subcategory") || "";

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      <Link
        href={buildUrl(sp, { subcategory: null })}
        className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
          !active
            ? "border-[#18A999] bg-[#EFF8F6] text-[#149486]"
            : "border-[#E5EAF1] bg-white text-[#718096]"
        }`}
      >
        كل {parent.name}
      </Link>
      {kids.map((c) => {
        const on = active === c.slug;
        return (
          <Link
            key={c.id}
            href={buildUrl(sp, { subcategory: c.slug })}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              on
                ? "border-[#18A999] bg-[#18A999] text-white"
                : "border-[#E5EAF1] bg-white text-[#718096]"
            }`}
          >
            {c.name}
          </Link>
        );
      })}
    </div>
  );
}
