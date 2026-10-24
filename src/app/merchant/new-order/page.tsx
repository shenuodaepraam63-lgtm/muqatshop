"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, productMainImage, type Product } from "@/lib/supabase";
import { getMerchantSession } from "@/lib/merchant";
import { formatPrice } from "@/lib/utils";
import { EGYPT_GOVERNORATES, GOVERNORATE_NAMES } from "@/lib/egypt-locations";
import { DEFAULT_SHIPPING_FEE, calcShipping, type ShippingSettings } from "@/lib/shipping";

type Line = {
  product: Product;
  qty: number;
  sellPrice: number;
};

export default function MerchantNewOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [q, setQ] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [center, setCenter] = useState("");
  const [area, setArea] = useState("");
  const [street, setStreet] = useState("");
  const [notes, setNotes] = useState("");
  const [shipSettings, setShipSettings] = useState<ShippingSettings>({
    fee: DEFAULT_SHIPPING_FEE,
    free_over: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => setProducts((data as Product[]) || []));
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "shipping")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && typeof data.value === "object") {
          const v = data.value as { fee?: number; free_over?: number | null };
          setShipSettings({
            fee: typeof v.fee === "number" ? v.fee : DEFAULT_SHIPPING_FEE,
            free_over: typeof v.free_over === "number" ? v.free_over : null,
          });
        }
      });
  }, []);

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
      { product: p, qty: 1, sellPrice: Number(p.price) },
    ]);
  };

  const baseSubtotal = lines.reduce(
    (s, l) => s + Number(l.product.price) * l.qty,
    0
  );
  const sellSubtotal = lines.reduce((s, l) => s + l.sellPrice * l.qty, 0);
  const profit = sellSubtotal - baseSubtotal;
  const shipping = governorate ? calcShipping(sellSubtotal, shipSettings) : 0;
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
      setError("أكمل بيانات العميل");
      return;
    }

    setLoading(true);
    try {
      const orderNumber = `MQ-M-${Date.now().toString(36).toUpperCase()}`;
      const payload = {
        order_number: orderNumber,
        customer_name: customerName.trim(),
        governorate,
        center,
        area: area.trim() || null,
        street: street.trim() || null,
        apartment: null,
        phone: phone.trim(),
        phone_alt: null,
        notes: notes.trim() || `طلب تاجر: ${session.name}`,
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

  const field = "w-full border rounded-xl px-3 py-2.5 text-sm";

  return (
    <form onSubmit={submit} className="space-y-6">
      <h1 className="text-xl font-bold">طلب جديد لعميل</h1>

      <div className="bg-white border rounded-2xl p-4 space-y-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن منتج..."
          className={field}
        />
        <div className="max-h-40 overflow-y-auto space-y-1">
          {filtered.slice(0, 20).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => addProduct(p)}
              className="w-full text-right text-sm px-2 py-2 rounded-lg hover:bg-[#f8f5f0] flex justify-between gap-2"
            >
              <span className="line-clamp-1">{p.name}</span>
              <span className="shrink-0 text-muted">{formatPrice(Number(p.price))}</span>
            </button>
          ))}
        </div>
      </div>

      {lines.length > 0 && (
        <div className="bg-white border rounded-2xl p-4 space-y-4">
          <h2 className="font-semibold text-sm">المنتجات والبيع</h2>
          {lines.map((l, idx) => (
            <div key={l.product.id} className="border-b border-[#eee] pb-3 space-y-2">
              <div className="flex justify-between gap-2">
                <p className="text-sm font-medium">{l.product.name}</p>
                <button
                  type="button"
                  className="text-xs text-sale"
                  onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                >
                  حذف
                </button>
              </div>
              <p className="text-xs text-muted">الأساسي: {formatPrice(Number(l.product.price))}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted">سعر البيع للعميل</label>
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
                                sellPrice: Math.max(Number(l.product.price), v || 0),
                              }
                            : x
                        )
                      );
                    }}
                    className={field}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">الكمية</label>
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
              </div>
              <p className="text-xs text-green-700">
                ربحك من السطر: {formatPrice((l.sellPrice - Number(l.product.price)) * l.qty)}
              </p>
            </div>
          ))}
          <div className="text-sm space-y-1 pt-2">
            <div className="flex justify-between">
              <span className="text-muted">تكلفة المتجر</span>
              <span>{formatPrice(baseSubtotal)}</span>
            </div>
            <div className="flex justify-between text-green-700 font-medium">
              <span>ربحك</span>
              <span>{formatPrice(profit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">شحن</span>
              <span>{governorate ? formatPrice(shipping) : "—"}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>يدفع العميل</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-sm">بيانات العميل</h2>
        <input className={field} required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="اسم العميل *" />
        <input className={field} required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="موبايل *" />
        <select className={field} required value={governorate} onChange={(e) => { setGovernorate(e.target.value); setCenter(""); }}>
          <option value="">المحافظة *</option>
          {GOVERNORATE_NAMES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select className={field} required value={center} onChange={(e) => setCenter(e.target.value)} disabled={!governorate}>
          <option value="">المركز *</option>
          {centers.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input className={field} value={area} onChange={(e) => setArea(e.target.value)} placeholder="المنطقة" />
        <input className={field} value={street} onChange={(e) => setStreet(e.target.value)} placeholder="الشارع" />
        <textarea className={field} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات" rows={2} />
      </div>

      {error && <p className="text-sm text-sale">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-ink text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-50"
      >
        {loading ? "جاري الإرسال..." : "تأكيد الطلب"}
      </button>
    </form>
  );
}
