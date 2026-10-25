"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, productMainImage, type Product } from "@/lib/supabase";
import { getMerchantSession } from "@/lib/merchant";
import { formatPrice } from "@/lib/utils";
import { EGYPT_GOVERNORATES, GOVERNORATE_NAMES } from "@/lib/egypt-locations";
import {
  getShippingSettings,
  shippingForGovernorate,
  type ShippingSettings,
} from "@/lib/shipping";
import {
  getLocalPrice,
  loadMarketerPages,
  type MarketerPage,
} from "@/lib/marketer-local";

type Line = {
  product: Product;
  qty: number;
  sellPrice: number;
};

function defaultSell(p: Product): number {
  const local = getLocalPrice(p.id);
  if (local != null && local >= Number(p.price)) return local;
  return Number(p.price) || 0;
}

function NewOrderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preProduct = searchParams.get("product");

  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [q, setQ] = useState("");
  const [pages, setPages] = useState<MarketerPage[]>([]);
  const [pageId, setPageId] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneAlt, setPhoneAlt] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [center, setCenter] = useState("");
  const [landmark, setLandmark] = useState("");
  const [address, setAddress] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [shipSettings, setShipSettings] = useState<ShippingSettings | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPages(loadMarketerPages());
    getShippingSettings().then(setShipSettings);
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        const list = (data as Product[]) || [];
        setProducts(list);
        if (preProduct) {
          const p = list.find((x) => x.id === preProduct);
          if (p) {
            setLines([{ product: p, qty: 1, sellPrice: defaultSell(p) }]);
          }
        }
      });
  }, [preProduct]);

  const centers = useMemo(
    () => (governorate ? EGYPT_GOVERNORATES[governorate] || [] : []),
    [governorate]
  );

  const filtered = products.filter((p) =>
    !q.trim() ? true : p.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  const addProduct = (p: Product) => {
    if (lines.some((l) => l.product.id === p.id)) return;
    setLines((prev) => [
      ...prev,
      { product: p, qty: 1, sellPrice: defaultSell(p) },
    ]);
  };

  const baseSubtotal = lines.reduce(
    (s, l) => s + Number(l.product.price) * l.qty,
    0
  );
  const sellSubtotal = lines.reduce((s, l) => s + l.sellPrice * l.qty, 0);
  const profit = sellSubtotal - baseSubtotal;
  const shipping = governorate
    ? shippingForGovernorate(governorate, sellSubtotal, shipSettings)
    : 0;
  const total = sellSubtotal + shipping;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const session = getMerchantSession();
    if (!session) return;

    if (!lines.length) {
      setError("أضف منتجًا واحدًا على الأقل");
      return;
    }
    for (const l of lines) {
      if (l.sellPrice < Number(l.product.price)) {
        setError(`سعر «${l.product.name}» أقل من السعر الأساسي`);
        return;
      }
    }
    if (!customerName.trim() || !phone.trim() || !governorate || !center) {
      setError("أكمل بيانات العميل والمحافظة والمركز");
      return;
    }
    if (!address.trim()) {
      setError("العنوان التفصيلي مطلوب");
      return;
    }

    const pageName = pages.find((p) => p.id === pageId)?.name;

    setLoading(true);
    try {
      const orderNumber = `MQ-M-${Date.now().toString(36).toUpperCase()}`;
      const notesParts = [
        notes.trim(),
        landmark.trim() ? `علامة مميزة: ${landmark.trim()}` : "",
        mapsUrl.trim() ? `خرائط: ${mapsUrl.trim()}` : "",
        pageName ? `الصفحة: ${pageName}` : "",
        `مسوق: ${session.name}`,
      ].filter(Boolean);

      const payload = {
        order_number: orderNumber,
        customer_name: customerName.trim(),
        governorate,
        center,
        area: landmark.trim() || null,
        street: address.trim(),
        apartment: null,
        phone: phone.trim(),
        phone_alt: phoneAlt.trim() || null,
        notes: notesParts.join(" | ") || null,
        items: lines.map((l) => ({
          productId: l.product.id,
          name: l.product.name,
          price: l.sellPrice,
          basePrice: Number(l.product.price),
          quantity: l.qty,
          image: productMainImage(l.product) || "",
        })),
        subtotal: sellSubtotal,
        base_subtotal: baseSubtotal,
        merchant_profit: profit,
        merchant_id: session.id,
        shipping,
        discount: 0,
        total,
        status: "new",
        profit_released: false,
      };

      const { error: err } = await supabase.from("orders").insert(payload);
      if (err) throw err;
      router.push("/merchant/orders");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل إنشاء الطلب");
    } finally {
      setLoading(false);
    }
  };

  const field =
    "w-full border border-[#eae6df] rounded-xl px-3 py-2.5 text-sm bg-white";

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">تسجيل طلب عميل جديد</h1>
        <p className="text-sm text-muted mt-1">
          أدخل بيانات العميل، اختر المنتجات وحدد سعر بيعك لحساب أرباحك الفورية.
          المنصة تتولى الشحن والتحصيل COD.
        </p>
      </div>

      <div className="bg-white border border-[#eae6df] rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-sm">المنتجات المطلوبة</h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن منتج..."
          className={field}
        />
        <div className="max-h-44 overflow-y-auto space-y-1 border border-[#f0ebe3] rounded-xl p-1">
          {filtered.slice(0, 25).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => addProduct(p)}
              className="w-full text-right text-sm px-2 py-2 rounded-lg hover:bg-[#f8f5f0] flex justify-between gap-2"
            >
              <span className="line-clamp-1">{p.name}</span>
              <span className="shrink-0 text-muted text-xs">
                أساسي {formatPrice(Number(p.price))}
              </span>
            </button>
          ))}
        </div>

        {lines.length > 0 && (
          <div className="space-y-4 pt-2 border-t border-[#f0ebe3]">
            {lines.map((l, idx) => (
              <div key={l.product.id} className="space-y-2">
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-medium">{l.product.name}</p>
                  <button
                    type="button"
                    className="text-xs text-sale"
                    onClick={() =>
                      setLines((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    حذف
                  </button>
                </div>
                <p className="text-xs text-muted">
                  السعر الأساسي للمسوق: {formatPrice(Number(l.product.price))}
                  {l.product.stock != null && (
                    <> · المخزون: {l.product.stock}</>
                  )}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-muted">الكمية</label>
                    <input
                      type="number"
                      min={1}
                      value={l.qty}
                      onChange={(e) => {
                        const v = Math.max(1, Number(e.target.value) || 1);
                        setLines((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, qty: v } : x))
                        );
                      }}
                      className={field}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted">
                      سعر البيع للعميل (EGP)
                    </label>
                    <input
                      type="number"
                      min={Number(l.product.price)}
                      step="1"
                      value={l.sellPrice}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setLines((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? {
                                  ...x,
                                  sellPrice: Math.max(
                                    Number(l.product.price),
                                    v || 0
                                  ),
                                }
                              : x
                          )
                        );
                      }}
                      className={field}
                    />
                  </div>
                </div>
                <p className="text-xs text-green-700 font-medium">
                  ربح المسوق المبدئي: +{" "}
                  {formatPrice(
                    (l.sellPrice - Number(l.product.price)) * l.qty
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-[#eae6df] rounded-2xl p-4 space-y-2">
        <h2 className="font-semibold text-sm">الصفحة التابعة للأوردر (اختياري)</h2>
        <select
          className={field}
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
        >
          <option value="">بدون صفحة (طلب عام مستقل)</option>
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-[#eae6df] rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-sm">بيانات العميل وعنوان الشحن بمصر</h2>
        <div>
          <label className="text-[11px] text-muted">اسم العميل ثلاثي أو رباعي *</label>
          <input
            className={field}
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="مثال: حسام محمد عبد الرحمن"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted">رقم الهاتف المحمول الأساسي *</label>
          <input
            className={field}
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            dir="ltr"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted">رقم هاتف بديل / واتساب (اختياري)</label>
          <input
            className={field}
            type="tel"
            value={phoneAlt}
            onChange={(e) => setPhoneAlt(e.target.value)}
            placeholder="01xxxxxxxxx"
            dir="ltr"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted">محافظة التوصيل *</label>
          <select
            className={field}
            required
            value={governorate}
            onChange={(e) => {
              setGovernorate(e.target.value);
              setCenter("");
            }}
          >
            <option value="">اختر المحافظة</option>
            {GOVERNORATE_NAMES.map((g) => {
              const fee = shippingForGovernorate(g, sellSubtotal, shipSettings);
              return (
                <option key={g} value={g}>
                  {g} ({fee} ج.م شحن)
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-muted">المركز / الحي / المدينة *</label>
          <select
            className={field}
            required
            value={center}
            onChange={(e) => setCenter(e.target.value)}
            disabled={!governorate}
          >
            <option value="">اختر</option>
            {centers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-muted">علامة مميزة (اختياري)</label>
          <input
            className={field}
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="بجوار مسجد...، أمام مدرسة..."
          />
        </div>
        <div>
          <label className="text-[11px] text-muted">العنوان التفصيلي بالتحديد *</label>
          <textarea
            className={field}
            required
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="اسم الشارع، رقم العمارة، رقم الطابق، رقم الشقة..."
          />
        </div>
        <div>
          <label className="text-[11px] text-muted">
            رابط موقع التوصيل على خرائط جوجل (اختياري)
          </label>
          <input
            className={field}
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            placeholder="https://maps.google.com/?q=..."
            dir="ltr"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted">ملاحظات خاصة للمندوب والتوصيل</label>
          <textarea
            className={field}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: الاتصال قبل الوصول بنصف ساعة..."
          />
        </div>
      </div>

      <div className="bg-white border border-[#eae6df] rounded-2xl p-4 space-y-2 text-sm">
        <h2 className="font-semibold">ملخص حساب الأوردر</h2>
        <div className="flex justify-between text-muted">
          <span>إجمالي السعر الأساسي للمسوق</span>
          <span>{formatPrice(baseSubtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>إجمالي سعر البيع للعميل</span>
          <span>{formatPrice(sellSubtotal)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>مصاريف الشحن{governorate ? ` (${governorate})` : ""}</span>
          <span>{governorate ? formatPrice(shipping) : "—"}</span>
        </div>
        <div className="flex justify-between font-bold text-base pt-1 border-t border-[#f0ebe3]">
          <span>إجمالي المطلوب من العميل (COD)</span>
          <span>{formatPrice(total)}</span>
        </div>
        <div className="flex justify-between text-green-700 font-semibold">
          <span>ربح المسوق المبدئي</span>
          <span>+{formatPrice(profit)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-sale">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-ink text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-50"
      >
        {loading ? "جاري التسجيل..." : "تأكيد وتسجيل الأوردر"}
      </button>
    </form>
  );
}

export default function MerchantNewOrderPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted py-12 text-center">جاري التحميل...</p>
      }
    >
      <NewOrderInner />
    </Suspense>
  );
}
