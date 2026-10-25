"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Loader2, PlusCircle } from "lucide-react";
import { supabase, productMainImage, type Product } from "@/lib/supabase";
import { getMerchantSession } from "@/lib/merchant";
import { formatPrice } from "@/lib/utils";
import { loadFavorites, saveFavorites } from "@/lib/marketer-local";

export default function MarketerFavoritesPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getMerchantSession()) return;
    const list = loadFavorites();
    setIds(list);
    if (!list.length) {
      setLoading(false);
      return;
    }
    supabase
      .from("products")
      .select("*")
      .in("id", list)
      .eq("is_active", true)
      .then(({ data }) => {
        setProducts((data as Product[]) || []);
        setLoading(false);
      });
  }, []);

  const remove = (id: string) => {
    const next = ids.filter((x) => x !== id);
    setIds(next);
    setProducts((p) => p.filter((x) => x.id !== id));
    saveFavorites(next);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">المفضلة</h1>
        <p className="text-sm text-muted mt-1">داخل بوابة المسوق فقط</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-[#e8e2d9] rounded-2xl p-10 text-center space-y-3">
          <Heart className="w-10 h-10 text-muted mx-auto" strokeWidth={1.25} />
          <p className="text-sm text-muted">لا توجد منتجات في المفضلة</p>
          <Link href="/merchant/catalog" className="text-sm text-accent hover:underline">
            الكتالوج
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {products.map((p) => {
            const img = productMainImage(p) || "";
            const href = `/merchant/catalog/${p.id}`;
            return (
              <div key={p.id} className="rounded-2xl overflow-hidden bg-[#f5f1e8]">
                <Link href={href} className="block">
                  <div className="relative aspect-square bg-[#ebe6dc]">
                    {img ? (
                      <Image src={img} alt={p.name} fill className="object-cover" sizes="50vw" />
                    ) : null}
                  </div>
                  <div className="p-2.5">
                    <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{p.name}</p>
                    <p className="text-xs text-muted mt-1">{formatPrice(Number(p.price))}</p>
                  </div>
                </Link>
                <div className="px-2.5 pb-3 flex gap-1.5">
                  <Link
                    href={href}
                    className="flex-1 text-center text-[11px] border border-ink rounded-full py-1.5"
                  >
                    تفاصيل
                  </Link>
                  <Link
                    href={`/merchant/new-order?product=${p.id}`}
                    className="flex-1 text-center text-[11px] bg-ink text-white rounded-full py-1.5 inline-flex items-center justify-center gap-0.5"
                  >
                    <PlusCircle className="w-3 h-3" /> أوردر
                  </Link>
                  <button type="button" onClick={() => remove(p.id)} className="text-[11px] text-sale px-1">
                    إزالة
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
