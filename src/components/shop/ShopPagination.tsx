"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function ShopPagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const sp = useSearchParams();
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const next = new URLSearchParams(sp.toString());
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    const q = next.toString();
    return q ? `/shop?${q}` : "/shop";
  };

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="صفحات المتجر">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
          page <= 1
            ? "pointer-events-none border-[#E5EAF1] text-[#C8D0DC]"
            : "border-[#E5EAF1] text-[#14243A] hover:border-[#3157D5]"
        }`}
      >
        السابق
      </Link>
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          className={`min-w-10 rounded-lg border px-3 py-2 text-center text-sm font-semibold ${
            p === page
              ? "border-[#3157D5] bg-[#3157D5] text-white"
              : "border-[#E5EAF1] text-[#14243A] hover:border-[#3157D5]"
          }`}
        >
          {p}
        </Link>
      ))}
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
          page >= totalPages
            ? "pointer-events-none border-[#E5EAF1] text-[#C8D0DC]"
            : "border-[#E5EAF1] text-[#14243A] hover:border-[#3157D5]"
        }`}
      >
        التالي
      </Link>
    </nav>
  );
}
