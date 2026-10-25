"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase, productMainImage, type Product } from "@/lib/supabase";
import {
  getMerchantSession,
  makeMerchantCode,
} from "@/lib/merchant";
import { merchantShareUrl } from "@/lib/merchant-ref";
import { formatPrice } from "@/lib/utils";
import { loadFavorites, toggleFavorite } from "@/lib/marketer-local";
import {
  Heart,
  Loader2,
  Search,
  PlusCircle,
  ImageOff,
  Copy,
  Link2,
  Check,
} from "lucide-react";

type MP = {
  product_id: string;
  selling_price: number;
};

export default function MerchantCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [mp, setMp] = useState<Record<string, MP>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [code, setCode] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [favs, setFavs] = useState<string[]>([]);
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
    setFavs(loadFavorites());
    (async () => {
      setLoading(true);
      const [{ data: prods }, { data: rows }] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(300),
        supabase
          .from("merchant_products")
          .select("product_id, selling_price")
          .eq("merchant_id", s.id),
      ]);
      setProducts((prods as Product[]) || []);
      const map: Record<string, MP> = {};
      const d: Record<string, string> = {};
      for (const r of rows || []) {
        map[r.product_id] = {
          product_id: r.product_id,
          selling_price: Number(r.selling_price),
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

  const onFav = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleFavorite(id);
    setFavs(next);
    showToast(next.includes(id) ? "أُضيف للمفضلة" : "أُزيل من المفضلة");
  };

  const savePrice = async (product: Product) => {
    if (!merchantId) return;
    const base = Number(product.price) || 0;
    const raw = draft[product.id] ?? "";
    const price = Number(raw);
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
      [product.id]: { product_id: product.id, selling_price: price },
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-ink">كتالوج المنتجات</h1>
          <p className="text-sm text-muted mt-1 leading-relaxed">
            الصور والتفاصيل من صفحة المنتج الأصلية — من هنا تسعّر وتنسخ وتسجّل أوردر
          </p>
        </div>
        <Link
          href="/merchant/favorites"
          className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
        >
          <Heart className="w-3.5 h-3.5" /> المفضلة ({favs.length})
        </Link>
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
          className="w-full border border-[#e8e2d9] rounded-xl pr-10 pl-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted py-12 text-sm">لا توجد منتجات</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {filtered.map((p) => {
            const img = productMainImage(p) || "";
            const base = Number(p.price) || 0;
            const sell = mp[p.id]?.selling_price;
            const draftVal = draft[p.id] ?? (sell != null ? String(sell) : "");
            const sellNum = Number(draftVal);
            const profit =
              !Number.isNaN(sellNum) && sellNum >= base ? sellNum - base : null;
            const liked = favs.includes(p.id);
            const storeHref = `/products/${encodeURIComponent(p.slug)}`;

            return (
              <article
                key={p.id}
                className="group rounded-2xl overflow-hidden bg-[#f5f1e8] border border-transparent hover:shadow-md hover:border-[#e8e2d9] transition flex flex-col"
              >
                {/* نفس عرض المتجر: الصورة تفتح صفحة المنتج الأصلية */}
                <Link href={storeHref} className="block" target="_blank" rel="noopener">
                  <div className="relative aspect-square bg-[#ebe6dc] overflow-hidden">
                    {img ? (
                      <Image
                        src={img}
                        alt={p.name}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted gap-1">
                        <ImageOff className="w-8 h-8 opacity-40" strokeWidth={1.25} />
                        <span className="text-[11px]">بدون صورة</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => onFav(e, p.id)}
                      className="absolute bottom-2 left-2 z-10 w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center"
                      aria-label="مفضلة"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          liked ? "fill-sale text-sale" : "text-ink"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="px-3 pt-3">
                    <h2 className="text-sm font-semibold text-ink line-clamp-2 leading-snug min-h-[2.5rem]">
                      {p.name}
                    </h2>
                    <p className="text-xs text-muted mt-1">
                      تكلفة المنصة:{" "}
                      <span className="font-bold text-ink">{formatPrice(base)}</span>
                    </p>
                    {profit != null && profit > 0 && (
                      <p className="text-xs text-green-700 mt-0.5">
                        ربحك المتوقع: {formatPrice(profit)}
                      </p>
                    )}
                  </div>
                </Link>

                <div className="px-3 pt-2 pb-3 mt-auto space-y-2">
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="number"
                      min={base}
                      step="1"
                      value={draftVal}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, [p.id]: e.target.value }))
                      }
                      placeholder={String(base)}
                      className="flex-1 min-w-0 border border-[#e8e2d9] rounded-xl px-2 py-1.5 text-xs bg-white"
                      aria-label="سعر البيع"
                    />
                    <button
                      type="button"
                      disabled={savingId === p.id}
                      onClick={() => savePrice(p)}
                      className="shrink-0 text-[11px] bg-ink text-white px-2.5 py-1.5 rounded-xl disabled:opacity-50"
                    >
                      {savingId === p.id ? "..." : "حفظ"}
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    <Link
                      href={storeHref}
                      target="_blank"
                      rel="noopener"
                      className="flex-1 text-center text-[11px] border border-ink rounded-full py-1.5 font-semibold hover:bg-ink hover:text-white transition"
                    >
                      عرض المنتج
                    </Link>
                    <Link
                      href={`/merchant/new-order?product=${p.id}`}
                      className="flex-1 text-center text-[11px] bg-accent text-white rounded-full py-1.5 font-semibold inline-flex items-center justify-center gap-0.5"
                    >
                      <PlusCircle className="w-3 h-3" /> أوردر
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => copyText(productLink(p.slug), "الرابط")}
                      className="inline-flex items-center gap-1 text-[10px] border border-[#e8e2d9] px-2 py-1 rounded-full hover:bg-white"
                    >
                      <Link2 className="w-3 h-3" /> رابط
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const priceFinal = sell ?? base;
                        const desc = (p.description || "").trim();
                        const text = `${p.name}\nالسعر: ${priceFinal} ج.م\n${desc ? desc.slice(0, 200) + "\n" : ""}${productLink(p.slug)}`;
                        copyText(text, "المنشور");
                      }}
                      className="inline-flex items-center gap-1 text-[10px] border border-[#25D366]/40 text-[#128C7E] px-2 py-1 rounded-full"
                    >
                      <Copy className="w-3 h-3" /> منشور
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
