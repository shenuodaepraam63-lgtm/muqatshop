"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import {
  EGYPT_GOVERNORATES,
  GOVERNORATE_NAMES,
} from "@/lib/egypt-locations";
import {
  DEFAULT_SHIPPING_FEE,
  calcShipping,
  type ShippingSettings,
} from "@/lib/shipping";
import { validateCoupon, incrementCouponUse } from "@/lib/coupons";
import { decrementStockForItems } from "@/lib/stock";

export function CheckoutForm() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = useCartStore((s) => s.totalPrice());

  const [fullName, setFullName] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [center, setCenter] = useState("");
  const [area, setArea] = useState("");
  const [street, setStreet] = useState("");
  const [apartment, setApartment] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneAlt, setPhoneAlt] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [shipSettings, setShipSettings] = useState<ShippingSettings>({
    fee: DEFAULT_SHIPPING_FEE,
    free_over: null,
  });
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "shipping")
        .maybeSingle();
      if (data?.value && typeof data.value === "object") {
        const v = data.value as { fee?: number; free_over?: number | null };
        setShipSettings({
          fee: typeof v.fee === "number" ? v.fee : DEFAULT_SHIPPING_FEE,
          free_over: typeof v.free_over === "number" ? v.free_over : null,
        });
      }
    })();
  }, []);

  const centers = useMemo(
    () => (governorate ? EGYPT_GOVERNORATES[governorate] || [] : []),
    [governorate]
  );

  const shipping = governorate ? calcShipping(subtotal, shipSettings) : 0;
  const total = Math.max(0, subtotal - discount + shipping);

  const onGovChange = (v: string) => {
    setGovernorate(v);
    setCenter("");
  };

  const applyCoupon = async () => {
    setCouponMsg("");
    const res = await validateCoupon(couponCode, subtotal);
    if (!res.ok) {
      setDiscount(0);
      setAppliedCouponId(null);
      setAppliedCode(null);
      setCouponMsg(res.error);
      return;
    }
    setDiscount(res.discount);
    setAppliedCouponId(res.coupon.id);
    setAppliedCode(res.coupon.code);
    setCouponMsg(`تم تطبيق خصم ${formatPrice(res.discount)}`);
  };

  const clearCoupon = () => {
    setDiscount(0);
    setAppliedCouponId(null);
    setAppliedCode(null);
    setCouponCode("");
    setCouponMsg("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !governorate || !center || !phone.trim()) {
      setError("من فضلك أكمل الحقول المطلوبة");
      return;
    }
    if (items.length === 0) {
      setError("السلة فارغة");
      return;
    }

    setLoading(true);
    try {
      let finalDiscount = discount;
      let finalCoupon = appliedCode;
      let couponId = appliedCouponId;

      if (appliedCode) {
        const re = await validateCoupon(appliedCode, subtotal);
        if (!re.ok) {
          setError(re.error);
          setLoading(false);
          return;
        }
        finalDiscount = re.discount;
        couponId = re.coupon.id;
        finalCoupon = re.coupon.code;
      }

      const ship = calcShipping(subtotal, shipSettings);
      const orderTotal = Math.max(0, subtotal - finalDiscount + ship);
      const orderNumber = `MQ-${Date.now().toString(36).toUpperCase()}`;

      const orderItems = items.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
        variant: i.variant,
      }));

      const payload = {
        order_number: orderNumber,
        customer_name: fullName.trim(),
        governorate,
        center,
        area: area.trim() || null,
        street: street.trim() || null,
        apartment: apartment.trim() || null,
        phone: phone.trim(),
        phone_alt: phoneAlt.trim() || null,
        notes: notes.trim() || null,
        items: orderItems,
        subtotal,
        shipping: ship,
        discount: finalDiscount,
        coupon_code: finalCoupon,
        total: orderTotal,
        status: "new",
      };

      const { error: insertError } = await supabase.from("orders").insert(payload);
      if (insertError) throw insertError;

      if (couponId) await incrementCouponUse(couponId);
      await decrementStockForItems(orderItems);

      clearCart();
      router.push(`/order-success?n=${encodeURIComponent(orderNumber)}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "حدث خطأ أثناء إرسال الطلب";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const field =
    "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ink/20";

  return (
    <form onSubmit={submit} className="bg-card/60 border border-border rounded-2xl p-5 md:p-6 space-y-4">
      <h2 className="text-lg font-bold text-ink mb-1">بيانات التوصيل</h2>
      <p className="text-xs text-muted mb-4">الحقول المعلّمة * مطلوبة</p>

      <div>
        <label className="block text-sm font-medium mb-1.5">اسمك كامل *</label>
        <input className={field} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="الاسم بالكامل" required />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">المحافظة *</label>
          <select className={field} value={governorate} onChange={(e) => onGovChange(e.target.value)} required>
            <option value="">اختر المحافظة</option>
            {GOVERNORATE_NAMES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">المركز / القسم *</label>
          <select className={field} value={center} onChange={(e) => setCenter(e.target.value)} required disabled={!governorate}>
            <option value="">{governorate ? "اختر المركز" : "اختر المحافظة أولاً"}</option>
            {centers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">المنطقة</label>
        <input className={field} value={area} onChange={(e) => setArea(e.target.value)} placeholder="مثال: الحي السابع" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">الشارع</label>
          <input className={field} value={street} onChange={(e) => setStreet(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">الشقة / المبنى</label>
          <input className={field} value={apartment} onChange={(e) => setApartment(e.target.value)} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">رقم التليفون *</label>
          <input className={field} type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">تليفون احتياطي</label>
          <input className={field} type="tel" inputMode="numeric" value={phoneAlt} onChange={(e) => setPhoneAlt(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">ملاحظات على الطلب</label>
        <textarea className={`${field} min-h-[80px] resize-y`} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="border border-dashed border-[#d4cfc4] rounded-xl p-3 space-y-2">
        <label className="block text-sm font-medium">كود خصم</label>
        <div className="flex gap-2">
          <input
            className={field}
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="مثال: SALE10"
            disabled={!!appliedCode}
          />
          {appliedCode ? (
            <button type="button" onClick={clearCoupon} className="shrink-0 px-4 rounded-xl border text-sm">إلغاء</button>
          ) : (
            <button type="button" onClick={applyCoupon} className="shrink-0 px-4 rounded-xl bg-ink text-white text-sm">تطبيق</button>
          )}
        </div>
        {couponMsg && <p className="text-xs text-muted">{couponMsg}</p>}
      </div>

      <div className="border-t border-border pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">المجموع الفرعي</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>خصم {appliedCode && `(${appliedCode})`}</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted">رسوم التوصيل</span>
          <span>{!governorate ? "—" : shipping === 0 ? "مجاني" : formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between text-base font-bold pt-1">
          <span>الإجمالي</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-sale bg-sale/10 rounded-lg px-3 py-2">{error}</p>}

      <button type="submit" disabled={loading || items.length === 0} className="w-full bg-ink text-page py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
        {loading ? "جاري إرسال الطلب..." : "إرسال الطلب"}
      </button>
    </form>
  );
}
