"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Clock, Tag } from "lucide-react";
import {
  clearSearchHistory,
  getSearchHistory,
  pushSearchHistory,
  removeSearchHistoryItem,
} from "@/lib/search-history";
import { formatPrice } from "@/lib/utils";

type SuggestProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  inStock: boolean;
};

type SuggestCategory = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  parent_id: string | null;
};

type SuggestPayload = {
  products: SuggestProduct[];
  categories: SuggestCategory[];
  phrases: string[];
};

export function SearchBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const urlQ = sp.get("q") || "";
  const [value, setValue] = useState(urlQ);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [data, setData] = useState<SuggestPayload>({
    products: [],
    categories: [],
    phrases: [],
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listId = useId();

  useEffect(() => {
    setValue(urlQ);
  }, [urlQ]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, [open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const runSuggest = useCallback(async (term: string) => {
    abortRef.current?.abort();
    if (term.trim().length < 2) {
      setData({ products: [], categories: [], phrases: [] });
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search/suggest?q=${encodeURIComponent(term.trim())}`,
        { signal: ctrl.signal }
      );
      if (!res.ok) throw new Error("suggest failed");
      const json = (await res.json()) as SuggestPayload;
      setData(json);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setData({ products: [], categories: [], phrases: [] });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => void runSuggest(value), 350);
    return () => clearTimeout(t);
  }, [value, open, runSuggest]);

  const goSearch = (term: string) => {
    const t = term.trim();
    setOpen(false);
    if (!t) {
      router.push("/shop");
      return;
    }
    pushSearchHistory(t);
    setHistory(getSearchHistory());
    // الحفاظ على فلاتر أخرى إن وُجدت في نفس الصفحة
    const next = new URLSearchParams(sp.toString());
    next.set("q", t);
    next.delete("page");
    router.push(`/shop?${next.toString()}`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goSearch(value);
  };

  const showIdle = open && value.trim().length < 2;
  const showTyped = open && value.trim().length >= 2;

  return (
    <div ref={rootRef} className="relative w-full">
      <form onSubmit={onSubmit} role="search" className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718096]" />
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="بتدور على إيه؟"
            className="h-[42px] w-full rounded-[10px] border border-[#E5EAF1] bg-white pr-10 pl-10 text-[13px] text-[#14243A] outline-none transition focus:border-[#3157D5] sm:h-12 sm:text-sm"
            aria-label="بحث"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={open}
            autoComplete="off"
          />
          {value ? (
            <button
              type="button"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#718096] hover:bg-[#F6F8FB]"
              aria-label="مسح"
              onClick={() => {
                setValue("");
                setData({ products: [], categories: [], phrases: [] });
                setOpen(true);
              }}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          className="hidden h-12 shrink-0 rounded-[10px] bg-[#3157D5] px-5 text-sm font-semibold text-white sm:inline-flex sm:items-center"
        >
          بحث
        </button>
      </form>

      {open && (showIdle || showTyped) && (
        <div
          id={listId}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[min(70vh,420px)] overflow-y-auto rounded-xl border border-[#E5EAF1] bg-white shadow-lg"
          role="listbox"
        >
          {showIdle && (
            <div className="p-3">
              {history.length > 0 && (
                <div className="mb-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-[#718096]">عمليات البحث الأخيرة</p>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-[#D64C4C]"
                      onClick={() => {
                        clearSearchHistory();
                        setHistory([]);
                      }}
                    >
                      مسح السجل
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {history.map((h) => (
                      <li key={h} className="flex items-center gap-1">
                        <button
                          type="button"
                          className="flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-right text-sm text-[#14243A] hover:bg-[#F6F8FB]"
                          onClick={() => goSearch(h)}
                        >
                          <Clock className="h-3.5 w-3.5 shrink-0 text-[#718096]" />
                          <span className="truncate">{h}</span>
                        </button>
                        <button
                          type="button"
                          className="rounded p-1.5 text-[#718096] hover:bg-[#F6F8FB]"
                          aria-label="حذف"
                          onClick={() => {
                            removeSearchHistoryItem(h);
                            setHistory(getSearchHistory());
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {history.length === 0 && (
                <p className="py-4 text-center text-sm text-[#718096]">
                  اكتب للبحث عن منتج أو تصنيف
                </p>
              )}
            </div>
          )}

          {showTyped && (
            <div className="p-3">
              {loading && (
                <p className="mb-2 text-xs text-[#718096]">جاري البحث...</p>
              )}

              {data.products.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-bold text-[#718096]">منتجات</p>
                  <ul className="space-y-1">
                    {data.products.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/products/${p.slug}`}
                          onClick={() => {
                            pushSearchHistory(value.trim());
                            setOpen(false);
                          }}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[#F6F8FB]"
                        >
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[#F6F8FB]">
                            {p.image ? (
                              <Image src={p.image} alt="" fill className="object-cover" sizes="40px" />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#14243A]">{p.name}</p>
                            <p className="text-xs text-[#3157D5]">{formatPrice(p.price)}</p>
                          </div>
                          {!p.inStock && (
                            <span className="text-[10px] text-[#D64C4C]">غير متوفر</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.categories.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-bold text-[#718096]">تصنيفات</p>
                  <ul className="space-y-1">
                    {data.categories.map((c) => {
                      const href = c.parent_id
                        ? `/shop?subcategory=${encodeURIComponent(c.slug)}`
                        : `/shop?category=${encodeURIComponent(c.slug)}`;
                      return (
                        <li key={c.id}>
                          <Link
                            href={href}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-[#14243A] hover:bg-[#F6F8FB]"
                          >
                            <Tag className="h-3.5 w-3.5 text-[#3157D5]" />
                            {c.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {data.phrases.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-bold text-[#718096]">عبارات مقترحة</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.phrases.map((ph) => (
                      <button
                        key={ph}
                        type="button"
                        onClick={() => goSearch(ph)}
                        className="rounded-full border border-[#E5EAF1] px-3 py-1 text-xs font-semibold text-[#526174] hover:border-[#3157D5]"
                      >
                        {ph}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!loading &&
                data.products.length === 0 &&
                data.categories.length === 0 && (
                  <p className="py-3 text-center text-sm text-[#718096]">
                    لا توجد اقتراحات — جرّب عرض كل النتائج
                  </p>
                )}

              <button
                type="button"
                onClick={() => goSearch(value)}
                className="mt-1 flex w-full items-center justify-center rounded-lg bg-[#EEF3FF] py-2.5 text-sm font-bold text-[#3157D5]"
              >
                عرض كل النتائج
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
