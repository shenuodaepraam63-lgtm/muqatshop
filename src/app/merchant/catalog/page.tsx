"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase, productMainImage, type Product } from "@/lib/supabase";
import { getMerchantSession } from "@/lib/merchant";
import { formatPrice } from "@/lib/utils";
import { loadFavorites, toggleFavorite } from "@/lib/marketer-local";
import {
  Heart,
  Loader2,
  Search,
  PlusCircle,
  ImageOff,
} from "lucide-react";

export default function MerchantCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [favs, setFavs] = useState<string[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!getMerchantSession()) return;
    setFavs(loadFavorites());
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(300)
      .then(({ data }) => {
        setProducts((data as Product[]) || []);
        setLoading(false);
      });
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
    setToast(next.includes(id) ? "أُضيف للمفضلة" : "أُزيل من المفضلة");
    setTimeout(() => setToast(""), 1500);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-ink">كتالوج المنتجات</h1>
          <p className="text-sm text-muted mt-1 leading-relaxed">
            كل التفاصيل جوه بوابة المسوق — مش بتتحول لحساب عميل
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      <div className="relative">
        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث عن منتج..."
          className="w-full border border-[#e8e2d9] rounded-xl pr-10 pl-4 py-2.5 text-sm bg-white"
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
            const liked = favs.includes(p.id);
            /** مسار المسوق فقط — مش /products */
            const href = `/merchant/catalog/${p.id}`;

            return (
              <article
                key={p.id}
                className="group rounded-2xl overflow-hidden bg-[#f5f1e8] hover:shadow-md transition flex flex-col"
              >
                <Link href={href} className="block">
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
                        <ImageOff className="w-8 h-8 opacity-40" />
                        <span className="text-[11px]">بدون صورة</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => onFav(e, p.id)}
                      className="absolute bottom-2 left-2 z-10 w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          liked ? "fill-sale text-sale" : "text-ink"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="px-3 pt-3">
                    <h2 className="text-sm font-semibold text-ink line-clamp-2 min-h-[2.5rem] leading-snug">
                      {p.name}
                    </h2>
                    <p className="text-xs text-muted mt-1">
                      التكلفة:{" "}
                      <span className="font-bold text-ink">{formatPrice(base)}</span>
                    </p>
                  </div>
                </Link>
                <div className="px-3 pb-3 pt-2 flex gap-1.5 mt-auto">
                  <Link
                    href={href}
                    className="flex-1 text-center text-[11px] border border-ink rounded-full py-2 font-semibold"
                  >
                    التفاصيل
                  </Link>
                  <Link
                    href={`/merchant/new-order?product=${p.id}`}
                    className="flex-1 text-center text-[11px] bg-accent text-white rounded-full py-2 font-semibold inline-flex items-center justify-center gap-0.5"
                  >
                    <PlusCircle className="w-3 h-3" /> أوردر
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
