"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  supabase,
  productMainImage,
  type Product,
  type ProductColor,
  type ProductVariant,
} from "@/lib/supabase";
import {
  getMerchantSession,
  makeMerchantCode,
} from "@/lib/merchant";
import { merchantShareUrl } from "@/lib/merchant-ref";
import { formatPrice } from "@/lib/utils";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductAccordion } from "@/components/product/ProductAccordion";
import {
  getLocalPrice,
  loadFavorites,
  setLocalPrice,
  toggleFavorite,
} from "@/lib/marketer-local";
import { softSpaceText } from "@/lib/product-display";
import {
  ArrowRight,
  Check,
  Copy,
  Heart,
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
  const [savedOk, setSavedOk] = useState(false);

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(""), 2000);
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

      // أولوية: سعر محلي → جدول merchant_products → سعر المنصة
      const local = getLocalPrice(id);
      if (local != null) {
        setSell(String(local));
      } else {
        const { data: mp } = await supabase
          .from("merchant_products")
          .select("selling_price")
          .eq("merchant_id", s.id)
          .eq("product_id", id)
          .maybeSingle();
        setSell(
          mp?.selling_price != null
            ? String(mp.selling_price)
            : String(Number(p.price) || 0)
        );
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
  const images = product.images?.length ? product.images : [];
  const colors = (product.colors || []) as ProductColor[];
  const sizes = (product.sizes || []) as string[];
  const variants = (product.variants || []) as ProductVariant[];
  const features = product.features
    ? product.features.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];

  const shareLink = merchantShareUrl(
    code,
    `/products/${encodeURIComponent(product.slug)}`
  );

  const savePrice = async () => {
    if (!merchantId) {
      showToast("سجّل الدخول كمسوق أولاً");
      return;
    }
    const price = Number(sell);
    if (Number.isNaN(price) || price < base) {
      showToast(`السعر لازم يكون ≥ ${formatPrice(base)}`);
      return;
    }

    setSaving(true);

    // 1) حفظ محلي دائمًا (يشتغل فورًا)
    setLocalPrice(product.id, price);
    setSavedOk(true);

    // 2) محاولة حفظ في قاعدة البيانات (لو الجدول/الصلاحيات موجودة)
    try {
      const { data: existing } = await supabase
        .from("merchant_products")
        .select("id")
        .eq("merchant_id", merchantId)
        .eq("product_id", product.id)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from("merchant_products")
          .update({
            selling_price: price,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("merchant_products").insert({
          merchant_id: merchantId,
          product_id: product.id,
          selling_price: price,
          is_active: true,
        });
      }
    } catch {
      // المحلي كافي لو الـ DB رفضت
    }

    setSaving(false);
    showToast("تم حفظ سعر البيع");
    setTimeout(() => setSavedOk(false), 2500);
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`تم نسخ ${label}`);
    } catch {
      showToast("فشل النسخ");
    }
  };

  // نفس أقسام صفحة المنتج القديمة
  const accordionItems: { title: string; content: React.ReactNode }[] = [];

  if (product.description?.trim()) {
    accordionItems.push({
      title: "الوصف",
      content: softSpaceText(product.description.trim()),
    });
  }
  if (features.length) {
    accordionItems.push({
      title: "المميزات",
      content: features.map((f) => `• ${f}`).join("\n"),
    });
  }
  if (product.specs?.trim()) {
    accordionItems.push({
      title: "المواصفات",
      content: softSpaceText(product.specs.trim()),
    });
  }
  if (product.care_instructions?.trim()) {
    accordionItems.push({
      title: "تعليمات العناية",
      content: product.care_instructions.trim(),
    });
  }
  const extra: string[] = [];
  if (product.material?.trim()) extra.push(`الخامة: ${product.material.trim()}`);
  if (product.weight?.trim()) extra.push(`الوزن: ${product.weight.trim()}`);
  if (product.dimensions?.trim())
    extra.push(`الأبعاد: ${product.dimensions.trim()}`);
  if (product.origin_country?.trim())
    extra.push(`بلد المنشأ: ${product.origin_country.trim()}`);
  if (extra.length) {
    accordionItems.push({ title: "تفاصيل إضافية", content: extra.join("\n") });
  }

  for (const s of product.detail_sections || []) {
    const title = (s.title || "").trim();
    if (!title) continue;
    const rows = (s.rows || []).filter(
      (r) => (r.label || "").trim() || (r.value || "").trim()
    );
    if (rows.length) {
      accordionItems.push({
        title,
        content: rows.map((r) => `${r.label}: ${r.value}`).join("\n"),
      });
    } else if ((s.content || "").trim()) {
      accordionItems.push({ title, content: (s.content || "").trim() });
    }
  }

  return (
    <div className="-mx-4 md:-mx-8 -mt-2">
      {/* شريط علوي زي المتجر */}
      <div className="bg-[#e8e2d4] text-[11px] tracking-wide text-muted">
        <div className="max-w-page mx-auto px-4 md:px-8 py-2.5 flex flex-wrap gap-1 items-center">
          <Link href="/merchant" className="hover:text-ink">
            بوابة المسوق
          </Link>
          <span>/</span>
          <Link href="/merchant/catalog" className="hover:text-ink">
            الكتالوج
          </Link>
          <span>/</span>
          <span className="text-ink line-clamp-1">{product.name}</span>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="max-w-page mx-auto px-4 md:px-8 py-5 md:py-10">
        <Link
          href="/merchant/catalog"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink mb-4"
        >
          <ArrowRight className="w-4 h-4" /> رجوع للكتالوج
        </Link>

        {/* نفس تخطيط صفحة المنتج القديمة: صورتين عمود */}
        <div className="grid min-w-0 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
          <div className="min-w-0">
            <ProductGallery images={images} name={product.name} />
          </div>

          <div className="min-w-0 md:sticky md:top-6 space-y-5">
            {product.brand?.trim() && (
              <p className="text-[11px] tracking-widest uppercase text-muted">
                {product.brand.trim()}
              </p>
            )}

            <h1 className="text-2xl md:text-3xl font-bold text-ink leading-tight">
              {product.name}
            </h1>

            {/* أسعار */}
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-sm text-muted">تكلفة المنصة</span>
              <span className="text-lg font-bold text-ink">{formatPrice(base)}</span>
            </div>

            {product.description?.trim() && (
              <p className="text-sm text-muted leading-relaxed line-clamp-3">
                {softSpaceText(product.description.trim())}
              </p>
            )}

            {/* ألوان / مقاسات للعرض فقط */}
            {colors.length > 0 && (
              <div>
                <p className="text-sm mb-2">الألوان</p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c, i) => (
                    <span
                      key={c.name + i}
                      title={c.name}
                      className="w-9 h-9 rounded-full border border-[#e8e2d9]"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            )}
            {sizes.length > 0 && (
              <div>
                <p className="text-sm mb-2">المقاسات</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <span
                      key={s}
                      className="min-w-[3rem] px-3 py-2 rounded-lg border border-[#e8e2d9] text-sm text-center"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.stock != null && (
              <p className="text-xs text-muted">المخزون: {product.stock} قطعة</p>
            )}

            {/* سعر البيع — يشتغل */}
            <div className="rounded-2xl border border-[#e8e2d9] bg-[#f5f1e8] p-4 space-y-3">
              <p className="text-sm font-semibold">سعر بيعك للعميل</p>
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  type="number"
                  inputMode="numeric"
                  min={base}
                  step="1"
                  value={sell}
                  onChange={(e) => {
                    setSell(e.target.value);
                    setSavedOk(false);
                  }}
                  className="flex-1 min-w-[100px] border border-[#e8e2d9] rounded-xl px-3 py-2.5 text-sm bg-white"
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={savePrice}
                  className="bg-ink text-white text-sm font-semibold px-5 py-2.5 rounded-full disabled:opacity-50"
                >
                  {saving ? "..." : savedOk ? "تم الحفظ ✓" : "حفظ السعر"}
                </button>
              </div>
              {profit != null && profit >= 0 && (
                <p className="text-sm text-green-700 font-medium">
                  ربحك المتوقع: {formatPrice(profit)}
                </p>
              )}
              <p className="text-[11px] text-muted">
                الحد الأدنى = تكلفة المنصة ({formatPrice(base)})
              </p>
            </div>

            {/* أزرار المسوق بدل السلة */}
            <div className="space-y-2">
              <Link
                href={`/merchant/new-order?product=${product.id}`}
                className="flex w-full items-center justify-center gap-2 bg-ink text-white py-3.5 rounded-full text-sm font-semibold"
              >
                <PlusCircle className="w-4 h-4" /> تسجيل أوردر بهذا المنتج
              </Link>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = toggleFavorite(product.id);
                    setLiked(next.includes(product.id));
                    showToast(
                      next.includes(product.id)
                        ? "أُضيف للمفضلة"
                        : "أُزيل من المفضلة"
                    );
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 border py-3 rounded-full text-sm font-semibold ${
                    liked
                      ? "border-sale text-sale"
                      : "border-[#e8e2d9] text-ink"
                  }`}
                >
                  <Heart
                    className="w-4 h-4"
                    fill={liked ? "currentColor" : "none"}
                  />
                  مفضلة
                </button>
                <button
                  type="button"
                  onClick={() => copyText(shareLink, "الرابط")}
                  className="flex-1 flex items-center justify-center gap-2 border border-[#e8e2d9] py-3 rounded-full text-sm font-semibold"
                >
                  <Link2 className="w-4 h-4" /> نسخ الرابط
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const priceFinal =
                    !Number.isNaN(sellNum) && sellNum >= base ? sellNum : base;
                  const desc = softSpaceText(product.description || "");
                  copyText(
                    `${product.name}\nالسعر: ${priceFinal} ج.م\n${desc ? desc.slice(0, 280) + "\n" : ""}${shareLink}`,
                    "المنشور"
                  );
                }}
                className="w-full flex items-center justify-center gap-2 border border-[#25D366] text-[#128C7E] py-3 rounded-full text-sm font-semibold"
              >
                <Copy className="w-4 h-4" /> نسخ منشور تسويقي
              </button>
            </div>

            {accordionItems.length > 0 && (
              <ProductAccordion items={accordionItems} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
