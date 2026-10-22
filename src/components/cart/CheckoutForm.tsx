"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import {
  EGYPT_GOVERNORATES,
  GOVERNORATE_NAMES,
  SHIPPING_FEE,
} from "@/lib/egypt-locations";

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

  const centers = useMemo(
    () => (governorate ? EGYPT_GOVERNORATES[governorate] || [] : []),
    [governorate]
  );

  const shipping = governorate ? SHIPPING_FEE : 0;
  const total = subtotal + shipping;

  const onGovChange = (v: string) => {
    setGovernorate(v);
    setCenter("");
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
      const orderNumber = `MQ-${Date.now().toString(36).toUpperCase()}`;
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
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
          variant: i.variant,
        })),
        subtotal,
        shipping: SHIPPING_FEE,
        total: subtotal + SHIPPING_FEE,
        status: "new",
      };

      const { error: insertError } = await supabase.from("orders").insert(payload);
      if (insertError) throw insertError;

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
        <input
          className={field}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="الاسم بالكامل"
          required
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">المحافظة *</label>
          <select
            className={field}
            value={governorate}
            onChange={(e) => onGovChange(e.target.value)}
            required
          >
            <option value="">اختر المحافظة</option>
            {GOVERNORATE_NAMES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">المركز / القسم *</label>
          <select
            className={field}
            value={center}
            onChange={(e) => setCenter(e.target.value)}
            required
            disabled={!governorate}
          >
            <option value="">
              {governorate ? "اختر المركز" : "اختر المحافظة أولاً"}
            </option>
            {centers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">المنطقة</label>
        <input
          className={field}
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="مثال: الحي السابع"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">الشارع</label>
          <input
            className={field}
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="اسم الشارع"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">الشقة / المبنى</label>
          <input
            className={field}
            value={apartment}
            onChange={(e) => setApartment(e.target.value)}
            placeholder="رقم العمارة / الشقة"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">رقم التليفون *</label>
          <input
            className={field}
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">تليفون احتياطي</label>
          <input
            className={field}
            type="tel"
            inputMode="numeric"
            value={phoneAlt}
            onChange={(e) => setPhoneAlt(e.target.value)}
            placeholder="اختياري"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">ملاحظات على الطلب</label>
        <textarea
          className={`${field} min-h-[90px] resize-y`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أي تفاصيل إضافية للتوصيل..."
        />
      </div>

      <div className="border-t border-border pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">المجموع الفرعي</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">رسوم التوصيل</span>
          <span>{governorate ? formatPrice(shipping) : "—"}</span>
        </div>
        <div className="flex justify-between text-base font-bold pt-1">
          <span>الإجمالي</span>
          <span>{formatPrice(total)}</span>
        </div>
        <p className="text-xs text-muted">
          رسوم التوصيل ثابتة {formatPrice(SHIPPING_FEE)} لكل المحافظات
        </p>
      </div>

      {error && (
        <p className="text-sm text-sale bg-sale/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || items.length === 0}
        className="w-full bg-ink text-page py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? "جاري إرسال الطلب..." : "إرسال الطلب"}
      </button>
    </form>
  );
}
