"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase, productMainImage, type Product } from "@/lib/supabase";
import { getMerchantSession } from "@/lib/merchant";
import { formatPrice } from "@/lib/utils";
import { loadFavorites, toggleFavorite } from "@/lib/marketer-local";
import { Heart, Loader2, Search, PlusCircle } from "lucide-react";

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
        (p.brand || "").toLowerCase().includes(t) ||
        (p.description || "").toLowerCase().includes(t)
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
          <h1 className="text-xl font-bold">كتالوج المنتجات</h1>
          <p className="text-sm text-muted mt-1">
            تصفّح زي المتجر — افتح المنتج لتشوف الصور والتفاصيل وتسعّر وتسجّل أوردر
          </p>
        </div>
        <Link
          href="/merchant/favorites"
          className="text-xs text-[#0042EB] hover:underline flex items-center gap-1"
        >
          <Heart className="w-3.5 h-3.5" /> المفضلة ({favs.length})
        </Link>
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      <div className="relative">
        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث عن منتج..."
          className="w-full border border-[#eae6df] rounded-xl pr-10 pl-4 py-2.5 text-sm bg-white"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted py-12 text-sm">لا توجد منتجات</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {filtered.map((p) => {
            const img = productMainImage(p) || "";
            const base = Number(p.price) || 0;
            const liked = favs.includes(p.id);
            const low =
              p.stock != null && Number(p.stock) > 0 && Number(p.stock) <= 3;

            return (
              <div
                key={p.id}
                className="group rounded-2xl overflow-hidden bg-white border border-[#eae6df] hover:shadow-md transition"
              >
                <Link
                  href={`/merchant/catalog/${p.id}`}
                  className="block"
                >
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
                      <div className="absolute inset-0 flex items-center justify-center text-muted text-xs">
                        بدون صورة
                      </div>
                    )}
                    {low && (
                      <span className="absolute top-2 left-2 z-10 bg-ink/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        متبقي {p.stock}
                      </span>
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
                  <div className="px-2.5 pt-2.5 pb-2">
                    <h2 className="text-sm font-semibold text-ink line-clamp-2 leading-snug min-h-[2.5rem]">
                      {p.name}
                    </h2>
                    <p className="text-xs text-muted mt-1">
                      التكلفة:{" "}
                      <span className="font-semibold text-ink">
                        {formatPrice(base)}
                      </span>
                    </p>
                  </div>
                </Link>
                <div className="px-2.5 pb-3 flex gap-1.5">
                  <Link
                    href={`/merchant/catalog/${p.id}`}
                    className="flex-1 text-center text-[11px] border border-ink rounded-full py-1.5 font-medium"
                  >
                    التفاصيل
                  </Link>
                  <Link
                    href={`/merchant/new-order?product=${p.id}`}
                    className="flex-1 text-center text-[11px] bg-ink text-white rounded-full py-1.5 font-medium inline-flex items-center justify-center gap-0.5"
                  >
                    <PlusCircle className="w-3 h-3" /> أوردر
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
