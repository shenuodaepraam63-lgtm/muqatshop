"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Loader2, Images } from "lucide-react";
import { supabase, productMainImage, type Product } from "@/lib/supabase";
import { getMerchantSession } from "@/lib/merchant";
import { formatPrice } from "@/lib/utils";

export default function MarketerMediaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!getMerchantSession()) return;
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(40)
      .then(({ data }) => {
        setProducts((data as Product[]) || []);
        setLoading(false);
      });
  }, []);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(`تم نسخ ${label}`);
      setTimeout(() => setToast(""), 1600);
    } catch {
      setToast("فشل النسخ");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">الوسائط التسويقية</h1>
        <p className="text-sm text-muted mt-1">
          صور وروابط ووصف جاهز للنسخ في إعلاناتك ومنشوراتك
        </p>
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-sm px-4 py-2 rounded-full flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-muted">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border rounded-2xl p-10 text-center text-sm text-muted">
          <Images className="w-10 h-10 mx-auto mb-2 opacity-50" />
          لا منتجات بعد
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((p) => {
            const img = productMainImage(p) || "";
            const imgs = (p.images || []).filter(Boolean);
            const desc = (p.description || "").trim();
            const caption = `${p.name}\nالسعر يبدأ من ${formatPrice(Number(p.price))}\n${desc ? desc.slice(0, 200) : "اطلب الآن — الدفع عند الاستلام"}`;
            return (
              <article
                key={p.id}
                className="bg-white border border-[#eae6df] rounded-2xl p-4 space-y-3"
              >
                <div className="flex gap-3">
                  <div className="w-20 h-20 rounded-xl bg-[#f5f1e8] overflow-hidden shrink-0">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-sm">{p.name}</h2>
                    <p className="text-xs text-muted mt-1">
                      أساسي: {formatPrice(Number(p.price))} · {imgs.length} صورة
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copy(caption, "الكابشن")}
                    className="inline-flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-full"
                  >
                    <Copy className="w-3.5 h-3.5" /> نسخ كابشن
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(imgs.join("\n") || img, "الصور")}
                    className="inline-flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-full"
                  >
                    <Copy className="w-3.5 h-3.5" /> روابط الصور
                  </button>
                  {desc && (
                    <button
                      type="button"
                      onClick={() => copy(desc, "الوصف")}
                      className="inline-flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-full"
                    >
                      <Copy className="w-3.5 h-3.5" /> الوصف الكامل
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
