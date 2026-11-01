"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

type Draft = {
  min: string;
  max: string;
  stock: string;
  offers: boolean;
};

export function ShopFiltersPanel({
  mode = "sidebar",
  open,
  onClose,
}: {
  mode?: "sidebar" | "drawer";
  open?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [draft, setDraft] = useState<Draft>({
    min: sp.get("min") || "",
    max: sp.get("max") || "",
    stock: sp.get("stock") || "all",
    offers: sp.get("offers") === "true",
  });

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    price: false,
    stock: false,
    offers: false,
  });

  useEffect(() => {
    setDraft({
      min: sp.get("min") || "",
      max: sp.get("max") || "",
      stock: sp.get("stock") || "all",
      offers: sp.get("offers") === "true",
    });
  }, [sp]);

  const apply = () => {
    const next = new URLSearchParams(sp.toString());
    if (draft.min.trim()) next.set("min", draft.min.trim());
    else next.delete("min");
    if (draft.max.trim()) next.set("max", draft.max.trim());
    else next.delete("max");
    if (draft.stock === "in") next.set("stock", "in");
    else next.delete("stock");
    if (draft.offers) next.set("offers", "true");
    else next.delete("offers");
    next.delete("page");
    const q = next.toString();
    router.push(q ? `/shop?${q}` : "/shop");
    onClose?.();
  };

  const clear = () => {
    const next = new URLSearchParams(sp.toString());
    ["min", "max", "stock", "offers", "page"].forEach((k) => next.delete(k));
    const q = next.toString();
    router.push(q ? `/shop?${q}` : "/shop");
    onClose?.();
  };

  const body = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#14243A]">الفلاتر</h3>
        {mode === "drawer" && (
          <button type="button" onClick={onClose} aria-label="إغلاق" className="p-1">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <FilterGroup
        title="السعر"
        open={openGroups.price}
        onToggle={() => setOpenGroups((g) => ({ ...g, price: !g.price }))}
      >
        <div className="flex gap-2">
          <input
            inputMode="numeric"
            placeholder="من"
            value={draft.min}
            onChange={(e) => setDraft((d) => ({ ...d, min: e.target.value }))}
            className="w-full rounded-lg border border-[#E5EAF1] px-2 py-2 text-sm"
            dir="ltr"
          />
          <input
            inputMode="numeric"
            placeholder="إلى"
            value={draft.max}
            onChange={(e) => setDraft((d) => ({ ...d, max: e.target.value }))}
            className="w-full rounded-lg border border-[#E5EAF1] px-2 py-2 text-sm"
            dir="ltr"
          />
        </div>
      </FilterGroup>

      <FilterGroup
        title="التوفر"
        open={openGroups.stock}
        onToggle={() => setOpenGroups((g) => ({ ...g, stock: !g.stock }))}
      >
        <label className="flex items-center gap-2 text-sm text-[#526174]">
          <input
            type="checkbox"
            checked={draft.stock === "in"}
            onChange={(e) =>
              setDraft((d) => ({ ...d, stock: e.target.checked ? "in" : "all" }))
            }
          />
          متوفر فقط
        </label>
      </FilterGroup>

      <FilterGroup
        title="العروض"
        open={openGroups.offers}
        onToggle={() => setOpenGroups((g) => ({ ...g, offers: !g.offers }))}
      >
        <label className="flex items-center gap-2 text-sm text-[#526174]">
          <input
            type="checkbox"
            checked={draft.offers}
            onChange={(e) => setDraft((d) => ({ ...d, offers: e.target.checked }))}
          />
          منتجات مخفضة فقط
        </label>
      </FilterGroup>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={apply}
          className="h-11 rounded-xl bg-[#3157D5] text-sm font-semibold text-white"
        >
          تطبيق
        </button>
        <button
          type="button"
          onClick={clear}
          className="h-10 rounded-xl border border-[#E5EAF1] text-sm font-semibold text-[#526174]"
        >
          مسح الفلاتر
        </button>
      </div>
    </div>
  );

  if (mode === "drawer") {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-[60] lg:hidden">
        <button
          type="button"
          className="absolute inset-0 bg-black/40"
          aria-label="إغلاق الفلاتر"
          onClick={onClose}
        />
        <div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto rounded-l-2xl bg-white p-[18px] shadow-xl">
          {body}
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden w-[250px] shrink-0 rounded-xl border border-[#E5EAF1] bg-white p-4 lg:block">
      {body}
    </aside>
  );
}

function FilterGroup({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#E5EAF1]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-semibold text-[#14243A]"
      >
        {title}
        <span className="text-[#718096]">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="border-t border-[#E5EAF1] px-3 py-3">{children}</div>}
    </div>
  );
}

export function ActiveFilterChips() {
  const router = useRouter();
  const sp = useSearchParams();
  const chips: { key: string; label: string }[] = [];

  if (sp.get("q")) chips.push({ key: "q", label: `بحث: ${sp.get("q")}` });
  if (sp.get("category")) chips.push({ key: "category", label: `تصنيف: ${sp.get("category")}` });
  if (sp.get("subcategory"))
    chips.push({ key: "subcategory", label: `فرعي: ${sp.get("subcategory")}` });
  if (sp.get("offers") === "true") chips.push({ key: "offers", label: "عروض" });
  if (sp.get("stock") === "in") chips.push({ key: "stock", label: "متوفر" });
  if (sp.get("min")) chips.push({ key: "min", label: `من ${sp.get("min")}` });
  if (sp.get("max")) chips.push({ key: "max", label: `إلى ${sp.get("max")}` });

  if (!chips.length) return null;

  const remove = (key: string) => {
    const next = new URLSearchParams(sp.toString());
    next.delete(key);
    if (key === "category") next.delete("subcategory");
    next.delete("page");
    const q = next.toString();
    router.push(q ? `/shop?${q}` : "/shop");
  };

  const clearAll = () => router.push("/shop");

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => remove(c.key)}
          className="inline-flex items-center gap-1 rounded-full border border-[#C8D6FF] bg-[#EEF3FF] px-2.5 py-1 text-[11px] font-semibold text-[#3157D5]"
        >
          {c.label}
          <X className="h-3 w-3" />
        </button>
      ))}
      <button type="button" onClick={clearAll} className="text-xs font-semibold text-[#718096] underline">
        مسح الكل
      </button>
    </div>
  );
}
