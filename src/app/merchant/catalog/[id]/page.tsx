"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  supabase,
  productMainImage,
  type Product,
} from "@/lib/supabase";
import {
  getMerchantSession,
  makeMerchantCode,
} from "@/lib/merchant";
import { merchantShareUrl } from "@/lib/merchant-ref";
import { formatPrice } from "@/lib/utils";
import { ProductGallery } from "@/components/product/ProductGallery";
import {
  loadFavorites,
  toggleFavorite,
} from "@/lib/marketer-local";
import {
  ArrowRight,
  Check,
  Copy,
  FileText,
  Heart,
  Image as ImageIcon,
  Link2,
  Loader2,
  PlusCircle,
} from "lucide-react";

export default function MarketerProductDetailPage() {
  const params = useParams();
  const id = String(params.id || "");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [code, setCode] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [sell, setSell] = useState("");
  const [saving, setSaving] = useState(false);
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(""), 1800);
  };

  useEffect(() => {
    const s = getMerchantSession();
    if (!s || !id) return;
    setMerchantId(s.id);
    setCode(s.code || makeMerchantCode(s.id));
    setLiked(loadFavorites().includes(id));

    (async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .maybeSingle();

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const p = data as Product;
      setProduct(p);

      const { data: mp } = await supabase
        .from("merchant_products")
        .select("selling_price")
        .eq("merchant_id", s.id)
        .eq("product_id", id)
        .maybeSingle();

      if (mp?.selling_price != null) {
        setSell(String(mp.selling_price));
      } else {
        setSell(String(Number(p.price) || 0));
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-muted">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="text-sm text-muted py-12 text-center space-y-3">
        <p>المنتج غير موجود</p>
        <Link href="/merchant/catalog" className="text-[#0042EB] underline">
          العودة للكتالوج
        </Link>
      </div>
    );
  }

  const base = Number(product.price) || 0;
  const sellNum = Number(sell);
  const profit =
    !Number.isNaN(sellNum) && sellNum >= base ? sellNum - base : null;
  const images = product.images?.length ? product.images : [];
  const features = product.features
    ? product.features.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];

  const productLink = merchantShareUrl(
    code,
    `/products/${encodeURIComponent(product.slug)}`
  );

  const savePrice = async () => {
    if (!merchantId) return;
    const price = Number(sell);
    if (Number.isNaN(price) || price < base) {
      showToast(`السعر لازم يكون ≥ ${formatPrice(base)}`);
      return;
    }
    setSaving(true);
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
    setSaving(false);
    if (error) {
      showToast(error.message);
      return;
    }
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

  const onFav = () => {
    const next = toggleFavorite(product.id);
    setLiked(next.includes(product.id));
    showToast(next.includes(product.id) ? "أُضيف للمفضلة" : "أُزيل من المفضلة");
  };

  return (
    <div className="space-y-6">
      <Link
        href="/merchant/catalog"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ArrowRight className="w-4 h-4" /> الكتالوج
      </Link>

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-start">
        {/* معرض صور — نفس مكوّن المتجر */}
        <div className="bg-white border border-[#eae6df] rounded-2xl p-3 sm:p-4">
          <ProductGallery images={images} name={product.name} />
        </div>

        <div className="space-y-4">
          {product.brand?.trim() && (
            <p className="text-[11px] tracking-widest uppercase text-muted">
              {product.brand.trim()}
            </p>
          )}
          <h1 className="text-xl md:text-2xl font-bold text-ink leading-tight">
            {product.name}
          </h1>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="bg-[#f5f1e8] rounded-xl px-3 py-2">
              <p className="text-[10px] text-muted">تكلفة المنصة</p>
              <p className="font-bold">{formatPrice(base)}</p>
            </div>
            {product.stock != null && (
              <div className="bg-[#f5f1e8] rounded-xl px-3 py-2">
                <p className="text-[10px] text-muted">المخزون</p>
                <p className="font-bold">{product.stock} قطعة</p>
              </div>
            )}
            {profit != null && profit > 0 && (
              <div className="bg-green-50 text-green-800 rounded-xl px-3 py-2">
                <p className="text-[10px] opacity-80">ربحك المتوقع</p>
                <p className="font-bold">{formatPrice(profit)}</p>
              </div>
            )}
          </div>

          {product.description?.trim() && (
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
              {product.description.trim()}
            </p>
          )}

          {/* تسعير */}
          <div className="bg-white border border-[#eae6df] rounded-2xl p-4 space-y-3">
            <h2 className="text-sm font-semibold">سعر بيعك للعميل</h2>
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[120px]">
                <label className="text-[11px] text-muted block mb-1">
                  ج.م (الحد الأدنى {formatPrice(base)})
                </label>
                <input
                  type="number"
                  min={base}
                  step="1"
                  value={sell}
                  onChange={(e) => setSell(e.target.value)}
                  className="w-full border border-[#eae6df] rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={savePrice}
                className="bg-ink text-white text-sm px-5 py-2.5 rounded-xl disabled:opacity-50"
              >
                {saving ? "..." : "حفظ السعر"}
              </button>
            </div>
          </div>

          {/* إجراءات */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/merchant/new-order?product=${product.id}`}
              className="inline-flex items-center gap-1.5 bg-[#0042EB] text-white text-sm font-semibold px-4 py-2.5 rounded-full"
            >
              <PlusCircle className="w-4 h-4" /> تسجيل أوردر بهذا المنتج
            </Link>
            <button
              type="button"
              onClick={onFav}
              className={`inline-flex items-center gap-1.5 text-sm border px-4 py-2.5 rounded-full ${
                liked
                  ? "border-sale text-sale bg-sale/5"
                  : "border-[#eae6df] text-ink"
              }`}
            >
              <Heart
                className="w-4 h-4"
                fill={liked ? "currentColor" : "none"}
              />
              {liked ? "في المفضلة" : "أضف للمفضلة"}
            </button>
          </div>

          {/* أدوات تسويق */}
          <div className="bg-white border border-[#eae6df] rounded-2xl p-4 space-y-2">
            <h2 className="text-sm font-semibold">أدوات التسويق</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyText(productLink, "الرابط")}
                className="inline-flex items-center gap-1.5 text-xs border border-ink px-3 py-1.5 rounded-full"
              >
                <Link2 className="w-3.5 h-3.5" /> نسخ الرابط
              </button>
              <button
                type="button"
                onClick={() =>
                  copyText(
                    (product.description || "").trim() || product.name,
                    "الوصف"
                  )
                }
                className="inline-flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-full"
              >
                <FileText className="w-3.5 h-3.5" /> نسخ الوصف
              </button>
              <button
                type="button"
                onClick={() => {
                  const urls = (product.images || []).join("\n");
                  copyText(
                    urls || productMainImage(product) || "",
                    "الصور"
                  );
                }}
                className="inline-flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-full"
              >
                <ImageIcon className="w-3.5 h-3.5" /> نسخ روابط الصور
              </button>
              <button
                type="button"
                onClick={() => {
                  const priceFinal =
                    !Number.isNaN(sellNum) && sellNum >= base ? sellNum : base;
                  const desc = (product.description || "").trim();
                  const text = `${product.name}\nالسعر: ${priceFinal} ج.م\n${desc ? desc.slice(0, 280) + "\n" : ""}${productLink}`;
                  copyText(text, "منشور التسويق");
                }}
                className="inline-flex items-center gap-1.5 text-xs bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/40 px-3 py-1.5 rounded-full"
              >
                <Copy className="w-3.5 h-3.5" /> نسخ منشور كامل
              </button>
            </div>
            <p className="text-[11px] text-muted break-all dir-ltr text-left">
              {productLink}
            </p>
          </div>
        </div>
      </div>

      {/* تفاصيل إضافية */}
      {(features.length > 0 ||
        product.specs?.trim() ||
        product.material ||
        product.care_instructions) && (
        <div className="bg-white border border-[#eae6df] rounded-2xl p-4 space-y-4 text-sm">
          {features.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">المميزات</h3>
              <ul className="space-y-1 text-muted">
                {features.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
            </div>
          )}
          {product.specs?.trim() && (
            <div>
              <h3 className="font-semibold mb-2">المواصفات</h3>
              <p className="text-muted whitespace-pre-line">
                {product.specs.trim()}
              </p>
            </div>
          )}
          {(product.material ||
            product.weight ||
            product.dimensions ||
            product.origin_country) && (
            <div>
              <h3 className="font-semibold mb-2">تفاصيل</h3>
              <ul className="text-muted space-y-1">
                {product.material && <li>الخامة: {product.material}</li>}
                {product.weight && <li>الوزن: {product.weight}</li>}
                {product.dimensions && <li>الأبعاد: {product.dimensions}</li>}
                {product.origin_country && (
                  <li>بلد المنشأ: {product.origin_country}</li>
                )}
              </ul>
            </div>
          )}
          {product.care_instructions?.trim() && (
            <div>
              <h3 className="font-semibold mb-2">تعليمات العناية</h3>
              <p className="text-muted whitespace-pre-line">
                {product.care_instructions.trim()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* أقسام مخصصة */}
      {(product.detail_sections || []).map((s, idx) => {
        const title = (s.title || "").trim();
        if (!title) return null;
        const rows = (s.rows || []).filter(
          (r) => (r.label || "").trim() || (r.value || "").trim()
        );
        const isSpecs = s.kind === "specs" || rows.length > 0;
        if (isSpecs && rows.length) {
          return (
            <div
              key={idx}
              className="bg-white border border-[#eae6df] rounded-2xl p-4"
            >
              <h3 className="font-semibold mb-3 text-sm">{title}</h3>
              <dl className="space-y-2">
                {rows.map((r, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[minmax(0,40%)_1fr] gap-2 text-sm border-b border-[#f0ebe3] pb-2 last:border-0"
                  >
                    <dt className="font-medium">{r.label}</dt>
                    <dd className="text-muted">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        }
        if ((s.content || "").trim()) {
          return (
            <div
              key={idx}
              className="bg-white border border-[#eae6df] rounded-2xl p-4"
            >
              <h3 className="font-semibold mb-2 text-sm">{title}</h3>
              <p className="text-sm text-muted whitespace-pre-line">
                {(s.content || "").trim()}
              </p>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
