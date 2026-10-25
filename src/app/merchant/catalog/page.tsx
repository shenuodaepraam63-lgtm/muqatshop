"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase, productMainImage, type Product } from "@/lib/supabase";
import {
  getMerchantSession,
  makeMerchantCode,
} from "@/lib/merchant";
import { merchantShareUrl } from "@/lib/merchant-ref";
import { formatPrice } from "@/lib/utils";
import { Copy, Link2, Image as ImageIcon, FileText, Search, Loader2, Check } from "lucide-react";

type MP = {
  product_id: string;
  selling_price: number;
  is_active: boolean;
};

export default function MerchantCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [mp, setMp] = useState<Record<string, MP>>({});
  const [code, setCode] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(""), 1800);
  };

  useEffect(() => {
    const s = getMerchantSession();
    if (!s) return;
    setMerchantId(s.id);
    setCode(s.code || makeMerchantCode(s.id));
    (async () => {
      setLoading(true);
      const [{ data: prods }, { data: rows }] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("merchant_products")
          .select("product_id, selling_price, is_active")
          .eq("merchant_id", s.id),
      ]);
      setProducts((prods as Product[]) || []);
      const map: Record<string, MP> = {};
      const d: Record<string, string> = {};
      for (const r of rows || []) {
        map[r.product_id] = {
          product_id: r.product_id,
          selling_price: Number(r.selling_price),
          is_active: r.is_active !== false,
        };
        d[r.product_id] = String(r.selling_price);
      }
      setMp(map);
      setDraft(d);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(t) ||
        (p.slug || "").toLowerCase().includes(t) ||
        (p.brand || "").toLowerCase().includes(t)
    );
  }, [products, q]);

  const savePrice = async (product: Product) => {
    if (!merchantId) return;
    const raw = draft[product.id] ?? "";
    const price = Number(raw);
    const base = Number(product.price) || 0;
    if (!raw || Number.isNaN(price) || price < base) {
      showToast(`السعر لازم يكون ≥ ${formatPrice(base)}`);
      return;
    }
    setSavingId(product.id);
    const { error } = await supabase.from("merchant_products").upsert(
      {
        merchant_id: merchantId,
        product_id: product.id,
        selling_price: price,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "merchant_id,product_id" }
    );
    setSavingId(null);
    if (error) {
      showToast(error.message);
      return;
    }
    setMp((prev) => ({
      ...prev,
      [product.id]: { product_id: product.id, selling_price: price, is_active: true },
    }));
    showToast("تم حفظ سعر البيع");
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`تم نسخ ${label}`);
    } catch {
      showToast("فشل النسخ");
    }
  };

  const productLink = (slug: string) =>
    merchantShareUrl(code, `/products/${encodeURIComponent(slug)}`);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">كتالوج المنتجات</h1>
        <p className="text-sm text-muted mt-1">
          حدّد سعر بيعك، انسخ الرابط والصور والوصف — زي تاجر
        </p>
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="relative">
        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث عن منتج..."
          className="w-full border border-border rounded-xl pr-10 pl-4 py-2.5 text-sm bg-white"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted py-12 text-sm">لا توجد منتجات</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => {
            const base = Number(p.price) || 0;
            const sell = mp[p.id]?.selling_price;
            const draftVal = draft[p.id] ?? (sell != null ? String(sell) : "");
            const sellNum = Number(draftVal);
            const profit =
              !Number.isNaN(sellNum) && sellNum >= base ? sellNum - base : null;
            const img = productMainImage(p) || "";
            const desc = (p.description || "").trim();

            return (
              <article
                key={p.id}
                className="bg-white border border-border rounded-2xl p-3 sm:p-4 space-y-3"
              >
                <div className="flex gap-3">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#f5f1e8] shrink-0">
                    {img ? (
                      <Image src={img} alt={p.name} fill className="object-cover" sizes="96px" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-sm sm:text-base line-clamp-2">{p.name}</h2>
                    <p className="text-xs text-muted mt-1">
                      تكلفة المنصة: <span className="font-medium text-ink">{formatPrice(base)}</span>
                    </p>
                    {profit != null && profit > 0 && (
                      <p className="text-xs text-green-700 mt-0.5">
                        ربحك المتوقع: {formatPrice(profit)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-[11px] text-muted mb-1">سعر بيعك (ج.م)</label>
                    <input
                      type="number"
                      min={base}
                      step="1"
                      value={draftVal}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, [p.id]: e.target.value }))
                      }
                      placeholder={String(base)}
                      className="w-full border rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={savingId === p.id}
                    onClick={() => savePrice(p)}
                    className="bg-ink text-white text-sm px-4 py-2 rounded-xl disabled:opacity-50"
                  >
                    {savingId === p.id ? "..." : "حفظ السعر"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyText(productLink(p.slug), "الرابط")}
                    className="inline-flex items-center gap-1.5 text-xs border border-ink px-3 py-1.5 rounded-full"
                  >
                    <Link2 className="w-3.5 h-3.5" /> نسخ الرابط
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(desc || p.name, "الوصف")}
                    className="inline-flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-full"
                  >
                    <FileText className="w-3.5 h-3.5" /> نسخ الوصف
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const urls = (p.images || []).join("\n");
                      copyText(urls || img, "الصور");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-full"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> نسخ روابط الصور
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const sellFinal = sell ?? base;
                      const text = `${p.name}\nالسعر: ${sellFinal} ج.م\n${desc ? desc.slice(0, 280) + "\n" : ""}${productLink(p.slug)}`;
                      copyText(text, "منشور التسويق");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/40 px-3 py-1.5 rounded-full"
                  >
                    <Copy className="w-3.5 h-3.5" /> نسخ منشور كامل
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
