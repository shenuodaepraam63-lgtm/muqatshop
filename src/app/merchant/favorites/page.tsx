"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
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
        <p className="text-sm text-muted mt-1">
          أضف منتجات من الكتالوج بزر القلب للرجوع السريع
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-[#eae6df] rounded-2xl p-10 text-center space-y-3">
          <Heart className="w-10 h-10 text-muted mx-auto" strokeWidth={1.25} />
          <p className="text-sm text-muted">لا توجد منتجات في المفضلة بعد</p>
          <Link
            href="/merchant/catalog"
            className="inline-block text-sm text-[#0042EB] hover:underline"
          >
            تصفح الكتالوج وأضف للمفضلة
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const img = productMainImage(p) || "";
            return (
              <div
                key={p.id}
                className="bg-white border border-[#eae6df] rounded-2xl p-3 flex gap-3 items-center"
              >
                <div className="w-16 h-16 rounded-xl bg-[#f5f1e8] overflow-hidden shrink-0">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-2">{p.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    السعر الأساسي: {formatPrice(Number(p.price))}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Link
                    href={`/merchant/new-order?product=${p.id}`}
                    className="text-xs bg-ink text-white px-3 py-1.5 rounded-full text-center"
                  >
                    أوردر
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="text-xs text-sale px-2 py-1"
                  >
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
