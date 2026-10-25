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
  cleanSpecRows,
  looksLikeLongDump,
  softSpaceText,
} from "@/lib/product-display";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  FileText,
  Heart,
  Image as ImageIcon,
  ImageOff,
  Link2,
  Loader2,
  PlusCircle,
} from "lucide-react";

function CollapsibleText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const long = looksLikeLongDump(text);
  const [open, setOpen] = useState(!long);
  const cleaned = softSpaceText(text);

  return (
    <div>
      <div
        className={`marketer-prose marketer-collapse-body ${open ? "is-open" : ""} ${className}`}
      >
        <p className="whitespace-pre-line">{cleaned}</p>
      </div>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-2 text-xs font-semibold text-accent inline-flex items-center gap-1"
        >
          {open ? "عرض أقل" : "اقرأ المزيد"}
          <ChevronDown
            className={`w-3.5 h-3.5 transition ${open ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
}

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
        <Link href="/merchant/catalog" className="text-accent underline">
          العودة للكتالوج
        </Link>
      </div>
    );
  }

  const base = Number(product.price) || 0;
  const sellNum = Number(sell);
  const profit =
    !Number.isNaN(sellNum) && sellNum >= base ? sellNum - base : null;
  const images = (product.images || []).filter(Boolean);
  const features = product.features
    ? product.features
        .split("\n")
        .map((s) => softSpaceText(s))
        .filter(Boolean)
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
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink transition"
      >
        <ArrowRight className="w-4 h-4" /> الكتالوج
      </Link>

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-start">
        {/* معرض */}
        <div className="marketer-card p-3 sm:p-4 sticky top-4 md:top-6">
          {images.length > 0 ? (
            <ProductGallery images={images} name={product.name} />
          ) : (
            <div className="gallery-empty">
              <ImageOff className="w-10 h-10 opacity-40" strokeWidth={1.25} />
              <span>لا توجد صور لهذا المنتج</span>
              <span className="text-xs opacity-70">أضف صورًا من لوحة الإدارة</span>
            </div>
          )}
        </div>

        <div className="space-y-4 min-w-0">
          {product.brand?.trim() && (
            <p className="text-[11px] tracking-widest uppercase text-muted">
              {product.brand.trim()}
            </p>
          )}
          <h1 className="text-xl md:text-2xl font-bold text-ink leading-snug">
            {softSpaceText(product.name)}
          </h1>

          <div className="flex flex-wrap gap-2 text-sm">
            <div className="bg-[#f5f1e8] rounded-xl px-3 py-2 min-w-[5.5rem]">
              <p className="text-[10px] text-muted">تكلفة المنصة</p>
              <p className="font-bold text-ink">{formatPrice(base)}</p>
            </div>
            {product.stock != null && (
              <div className="bg-[#f5f1e8] rounded-xl px-3 py-2 min-w-[5.5rem]">
                <p className="text-[10px] text-muted">المخزون</p>
                <p className="font-bold text-ink">{product.stock} قطعة</p>
              </div>
            )}
            {profit != null && profit > 0 && (
              <div className="bg-green-50 text-green-800 rounded-xl px-3 py-2 min-w-[5.5rem]">
                <p className="text-[10px] opacity-80">ربحك المتوقع</p>
                <p className="font-bold">{formatPrice(profit)}</p>
              </div>
            )}
          </div>

          {product.description?.trim() && (
            <div className="marketer-card p-4">
              <h2 className="text-sm font-semibold text-ink mb-2">الوصف</h2>
              <CollapsibleText text={product.description.trim()} />
            </div>
          )}

          {/* تسعير */}
          <div className="marketer-card p-4 space-y-3">
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
                  className="w-full border border-[#e8e2d9] rounded-xl px-3 py-2.5 text-sm bg-page focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={savePrice}
                className="bg-ink text-white text-sm px-5 py-2.5 rounded-full font-semibold disabled:opacity-50"
              >
                {saving ? "..." : "حفظ السعر"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/merchant/new-order?product=${product.id}`}
              className="inline-flex items-center gap-1.5 bg-accent text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-sm hover:opacity-95 transition"
            >
              <PlusCircle className="w-4 h-4" /> تسجيل أوردر بهذا المنتج
            </Link>
            <button
              type="button"
              onClick={onFav}
              className={`inline-flex items-center gap-1.5 text-sm border px-4 py-2.5 rounded-full transition ${
                liked
                  ? "border-sale text-sale bg-sale/5"
                  : "border-[#e8e2d9] text-ink hover:bg-[#f5f1e8]"
              }`}
            >
              <Heart className="w-4 h-4" fill={liked ? "currentColor" : "none"} />
              {liked ? "في المفضلة" : "أضف للمفضلة"}
            </button>
          </div>

          <div className="marketer-card p-4 space-y-3">
            <h2 className="text-sm font-semibold">أدوات التسويق</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyText(productLink, "الرابط")}
                className="inline-flex items-center gap-1.5 text-xs border border-ink px-3 py-1.5 rounded-full hover:bg-ink hover:text-white transition"
              >
                <Link2 className="w-3.5 h-3.5" /> نسخ الرابط
              </button>
              <button
                type="button"
                onClick={() =>
                  copyText(
                    softSpaceText(product.description || "") || product.name,
                    "الوصف"
                  )
                }
                className="inline-flex items-center gap-1.5 text-xs border border-[#e8e2d9] px-3 py-1.5 rounded-full hover:bg-[#f5f1e8] transition"
              >
                <FileText className="w-3.5 h-3.5" /> نسخ الوصف
              </button>
              <button
                type="button"
                onClick={() => {
                  const urls = images.join("\n");
                  copyText(urls || productMainImage(product) || "", "الصور");
                }}
                className="inline-flex items-center gap-1.5 text-xs border border-[#e8e2d9] px-3 py-1.5 rounded-full hover:bg-[#f5f1e8] transition"
              >
                <ImageIcon className="w-3.5 h-3.5" /> نسخ روابط الصور
              </button>
              <button
                type="button"
                onClick={() => {
                  const priceFinal =
                    !Number.isNaN(sellNum) && sellNum >= base ? sellNum : base;
                  const desc = softSpaceText(product.description || "");
                  const text = `${product.name}\nالسعر: ${priceFinal} ج.م\n${desc ? desc.slice(0, 280) + "\n" : ""}${productLink}`;
                  copyText(text, "منشور التسويق");
                }}
                className="inline-flex items-center gap-1.5 text-xs bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/40 px-3 py-1.5 rounded-full"
              >
                <Copy className="w-3.5 h-3.5" /> نسخ منشور كامل
              </button>
            </div>
            <p className="text-[10px] text-muted break-all text-left" dir="ltr">
              {productLink}
            </p>
          </div>
        </div>
      </div>

      {/* مميزات */}
      {features.length > 0 && (
        <div className="marketer-card p-4">
          <h3 className="font-semibold text-sm mb-3">المميزات</h3>
          <ul className="space-y-2 text-sm text-muted leading-relaxed">
            {features.map((f, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent shrink-0">•</span>
                <span className="min-w-0">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {product.specs?.trim() && (
        <div className="marketer-card p-4">
          <h3 className="font-semibold text-sm mb-2">المواصفات</h3>
          <CollapsibleText text={product.specs.trim()} />
        </div>
      )}

      {(product.material ||
        product.weight ||
        product.dimensions ||
        product.origin_country) && (
        <div className="marketer-card p-4">
          <h3 className="font-semibold text-sm mb-2">تفاصيل</h3>
          <dl className="marketer-specs">
            {product.material && (
              <div className="marketer-specs-row">
                <dt>الخامة</dt>
                <dd>{product.material}</dd>
              </div>
            )}
            {product.weight && (
              <div className="marketer-specs-row">
                <dt>الوزن</dt>
                <dd>{product.weight}</dd>
              </div>
            )}
            {product.dimensions && (
              <div className="marketer-specs-row">
                <dt>الأبعاد</dt>
                <dd>{product.dimensions}</dd>
              </div>
            )}
            {product.origin_country && (
              <div className="marketer-specs-row">
                <dt>بلد المنشأ</dt>
                <dd>{product.origin_country}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {product.care_instructions?.trim() && (
        <div className="marketer-card p-4">
          <h3 className="font-semibold text-sm mb-2">تعليمات العناية</h3>
          <CollapsibleText text={product.care_instructions.trim()} />
        </div>
      )}

      {/* أقسام مخصصة — بعد تنظيف حشو أمازون */}
      {(product.detail_sections || []).map((s, idx) => {
        const title = softSpaceText(s.title || "");
        if (!title) return null;
        const rows = cleanSpecRows(s.rows);
        const isSpecs = s.kind === "specs" || rows.length > 0;
        if (isSpecs && rows.length) {
          return (
            <div key={idx} className="marketer-card p-4">
              <h3 className="font-semibold text-sm mb-3">{title}</h3>
              <dl className="marketer-specs">
                {rows.map((r, i) => (
                  <div key={i} className="marketer-specs-row">
                    <dt>{r.label}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        }
        if ((s.content || "").trim()) {
          return (
            <div key={idx} className="marketer-card p-4">
              <h3 className="font-semibold text-sm mb-2">{title}</h3>
              <CollapsibleText text={(s.content || "").trim()} />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
