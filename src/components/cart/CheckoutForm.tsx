"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { getMerchantSession, getMerchantSettings } from "@/lib/merchant";
import { getMerchantRef, clearMerchantRef } from "@/lib/merchant-ref";
import { notifyOrderWhatsApp } from "@/lib/whatsapp/client-notify";
import { loadAccountIdentity } from "@/lib/account-identity";
import { resolveCustomerId } from "@/lib/customer-account";
import { syncCustomerFromAuthUser } from "@/lib/auth-customer";
import { ensureCanPurchaseAsync, purchaseLoginHref } from "@/lib/purchase-guard";

/** Checkout + delivery form for cart (export required for Next typecheck). */
export function CheckoutForm() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = useCartStore((s) => s.totalPrice());
  const baseSubtotal = useCartStore((s) => s.totalBase());
  const submittingRef = useRef(false);

  const [selfMerchantId, setSelfMerchantId] = useState<string | null>(null);
  const [selfMerchantName, setSelfMerchantName] = useState<string | null>(null);
  const [refMerchantId, setRefMerchantId] = useState<string | null>(null);
  const [refMerchantName, setRefMerchantName] = useState<string | null>(null);

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
  const [authReady, setAuthReady] = useState(false);
  const [canCheckout, setCanCheckout] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);

  const [shipSettings, setShipSettings] = useState<ShippingSettings>({
    fee: DEFAULT_SHIPPING_FEE,
    free_over: 1000,
  });
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState("");

  useEffect(() => {
    (async () => {
      const ok = await ensureCanPurchaseAsync();
      setCanCheckout(ok);
      setAuthReady(true);

      if (!ok) return;

      // Prefill from Auth identity for customers (not marketer self-order)
      if (!getMerchantSession()) {
        const idRes = await loadAccountIdentity();
        if (idRes.ok) {
          setAccountEmail(idRes.identity.email);
          if (idRes.identity.fullName) setFullName(idRes.identity.fullName);
          if (idRes.identity.phone) setPhone(idRes.identity.phone);
          // Ensure customers row exists before checkout
          await syncCustomerFromAuthUser({
            name: idRes.identity.fullName || undefined,
          }).catch(() => null);
        }
      }
    })();
  }, []);

  useEffect(() => {
    const s = getMerchantSession();
    if (s) {
      setSelfMerchantId(s.id);
      setSelfMerchantName(s.name);
    } else {
      const ref = getMerchantRef();
      if (ref) {
        setRefMerchantId(ref.merchantId);
        setRefMerchantName(ref.name || null);
      }
    }
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
          free_over: typeof v.free_over === "number" ? v.free_over : 1000,
        });
      }
    })();
  }, []);

  const centers = useMemo(
    () => (governorate ? EGYPT_GOVERNORATES[governorate] || [] : []),
    [governorate]
  );
  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = governorate ? calcShipping(afterDiscount, shipSettings) : 0;
  const total = afterDiscount + shipping;
  const freeThreshold = shipSettings.free_over;
  const remainingForFree =
    freeThreshold != null ? Math.max(0, freeThreshold - afterDiscount) : null;
  const markupProfit = selfMerchantId
    ? Math.max(0, subtotal - baseSubtotal)
    : 0;

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

    if (submittingRef.current) return;

    const allowed = await ensureCanPurchaseAsync();
    if (!allowed) {
      window.location.href = purchaseLoginHref("/cart");
      return;
    }

    if (!fullName.trim() || !governorate || !center || !phone.trim()) {
      setError("من فضلك أكمل الحقول المطلوبة");
      return;
    }
    if (items.length === 0) {
      setError("السلة فارغة");
      return;
    }

    if (selfMerchantId) {
      for (const i of items) {
        const base = i.basePrice ?? i.price;
        if (i.price < base) {
          setError("ممنوع السعر أقل برجاء وضع سعر مناسب");
          return;
        }
      }
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      let finalDiscount = discount;
      let finalCoupon = appliedCode;
      let couponId = appliedCouponId;

      if (appliedCode && !selfMerchantId) {
        const re = await validateCoupon(appliedCode, subtotal);
        if (!re.ok) {
          setError(re.error);
          setLoading(false);
          submittingRef.current = false;
          return;
        }
        finalDiscount = re.discount;
        couponId = re.coupon.id;
        finalCoupon = re.coupon.code;
      }

      const net = Math.max(0, subtotal - finalDiscount);
      const ship = calcShipping(net, shipSettings);
      const orderTotal = net + ship;

      const linkedMerchantId = selfMerchantId || refMerchantId;
      const orderNumber = linkedMerchantId
        ? `MQ-M-${Date.now().toString(36).toUpperCase()}`
        : `MQ-${Date.now().toString(36).toUpperCase()}`;

      const orderItems = items.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        basePrice: i.basePrice ?? i.price,
        quantity: i.quantity,
        image: i.image,
        variant: i.variant,
      }));

      let profit = 0;
      if (selfMerchantId) {
        profit = Math.max(
          0,
          items.reduce(
            (s, i) => s + (i.price - (i.basePrice ?? i.price)) * i.quantity,
            0
          )
        );
      } else if (refMerchantId) {
        const settings = await getMerchantSettings();
        const { data: m } = await supabase
          .from("merchants")
          .select("commission_percent")
          .eq("id", refMerchantId)
          .maybeSingle();
        const pct =
          m?.commission_percent != null
            ? Number(m.commission_percent)
            : settings.commission_percent;
        profit = Math.round((net * pct) / 100);
      }

      const noteParts: string[] = [];
      if (notes.trim()) noteParts.push(notes.trim());
      if (selfMerchantId && selfMerchantName)
        noteParts.push(`طلب تاجر: ${selfMerchantName}`);
      if (!selfMerchantId && refMerchantId)
        noteParts.push(
          `إحالة تاجر: ${refMerchantName || refMerchantId.slice(0, 8)}`
        );

      // Customer path: require customer_id linkage (MQ-CUSTOMER / PR-3)
      let linkedCustomerId: string | null = null;
      let linkedCustomerEmail: string | null = null;

      if (!selfMerchantId) {
        const idRes = await loadAccountIdentity();
        if (!idRes.ok) {
          setError("يجب تسجيل الدخول لإتمام الطلب.");
          window.location.href = purchaseLoginHref("/cart");
          return;
        }
        linkedCustomerEmail = idRes.identity.email.toLowerCase();
        await syncCustomerFromAuthUser({
          name: idRes.identity.fullName || fullName.trim() || undefined,
        }).catch(() => null);
        linkedCustomerId = await resolveCustomerId(idRes.identity);
        if (!linkedCustomerId) {
          setError("تعذر ربط الطلب بحسابك. حدّث الصفحة وحاول مرة أخرى.");
          setLoading(false);
          submittingRef.current = false;
          return;
        }
      } else {
        // Marketer order for a client — optional identity link if Auth session exists
        try {
          const idRes = await loadAccountIdentity();
          if (idRes.ok) {
            linkedCustomerEmail = idRes.identity.email.toLowerCase();
            linkedCustomerId = await resolveCustomerId(idRes.identity);
          }
        } catch {
          /* optional */
        }
      }

      const payload: Record<string, unknown> = {
        order_number: orderNumber,
        customer_name: fullName.trim(),
        governorate,
        center,
        area: area.trim() || null,
        street: street.trim() || null,
        apartment: apartment.trim() || null,
        phone: phone.trim(),
        phone_alt: phoneAlt.trim() || null,
        notes: noteParts.length ? noteParts.join(" | ") : null,
        items: orderItems,
        subtotal,
        shipping: ship,
        discount: finalDiscount,
        coupon_code: finalCoupon,
        total: orderTotal,
        status: "new",
      };

      if (linkedCustomerId) payload.customer_id = linkedCustomerId;
      if (linkedCustomerEmail) payload.customer_email = linkedCustomerEmail;

      if (linkedMerchantId) {
        payload.merchant_id = linkedMerchantId;
        payload.base_subtotal = selfMerchantId ? baseSubtotal : net;
        payload.merchant_profit = profit;
        payload.profit_released = false;
      }

      const { error: insertError } = await supabase.from("orders").insert(payload);
      if (insertError) throw insertError;

      if (couponId) await incrementCouponUse(couponId);
      await decrementStockForItems(orderItems);
      if (refMerchantId && !selfMerchantId) clearMerchantRef();

      notifyOrderWhatsApp(orderNumber);

      clearCart();
      router.push(`/order-success?n=${encodeURIComponent(orderNumber)}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "حدث خطأ أثناء إرسال الطلب";
      setError(msg);
      submittingRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  if (!authReady) {
    return (
      <div className="bg-white border border-border rounded-card p-5 text-sm text-muted">
        جاري التحقق من الجلسة...
      </div>
    );
  }

  if (!canCheckout) {
    return (
      <div className="bg-white border border-border rounded-card p-5 md:p-6 space-y-4 shadow-card text-center">
        <h2 className="text-lg font-bold text-ink">إتمام الطلب يتطلب حسابًا</h2>
        <p className="text-sm text-muted leading-7">
          يمكنك تصفح السلة كزائر. لتأكيد الطلب سجّل الدخول أو أنشئ حسابًا — محتويات
          السلة تبقى محفوظة على هذا الجهاز.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href={purchaseLoginHref("/cart")}
            className="btn-primary inline-flex justify-center"
          >
            تسجيل الدخول لإتمام الطلب
          </Link>
          <Link
            href="/register/customer"
            className="btn-secondary inline-flex justify-center"
          >
            إنشاء حساب عميل
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-border rounded-card p-5 md:p-6 space-y-4 shadow-card"
    >
      <h2 className="text-lg font-bold text-ink mb-1">بيانات التوصيل</h2>
      <p className="text-xs text-muted mb-4">
        {selfMerchantId
          ? "أدخل بيانات العميل — الطلب يُسجَّل على حسابك كمسوق"
          : accountEmail
            ? `الطلب سيُربط بحسابك (${accountEmail})`
            : "الحقول المعلّمة * مطلوبة"}
      </p>

      {!selfMerchantId && refMerchantId && (
        <p className="text-xs bg-surface-2 rounded-xl px-3 py-2 text-muted border border-border">
          طلب عبر رابط مسوق{refMerchantName ? ` (${refMerchantName})` : ""}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">
          {selfMerchantId ? "اسم العميل *" : "اسمك كامل *"}
        </label>
        <input
          className="input-field"
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
            className="input-field"
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
            className="input-field"
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
          className="input-field"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="مثال: الحي السابع"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">الشارع</label>
          <input
            className="input-field"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">الشقة / المبنى</label>
          <input
            className="input-field"
            value={apartment}
            onChange={(e) => setApartment(e.target.value)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">رقم التليفون *</label>
          <input
            className="input-field"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">تليفون احتياطي</label>
          <input
            className="input-field"
            type="tel"
            inputMode="numeric"
            value={phoneAlt}
            onChange={(e) => setPhoneAlt(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">ملاحظات على الطلب</label>
        <textarea
          className="input-field min-h-[80px] resize-y"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {!selfMerchantId && (
        <div className="border border-dashed border-border rounded-xl p-3 space-y-2 bg-surface-2/40">
          <label className="block text-sm font-medium">كود خصم</label>
          <div className="flex gap-2">
            <input
              className="input-field"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="مثال: SALE10"
              disabled={!!appliedCode}
            />
            {appliedCode ? (
              <button type="button" onClick={clearCoupon} className="btn-secondary shrink-0">
                إلغاء
              </button>
            ) : (
              <button type="button" onClick={applyCoupon} className="btn-primary shrink-0">
                تطبيق
              </button>
            )}
          </div>
          {couponMsg && <p className="text-xs text-muted">{couponMsg}</p>}
        </div>
      )}

      <div className="border-t border-border pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">المجموع الفرعي</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {selfMerchantId && markupProfit > 0 && (
          <div className="flex justify-between text-success">
            <span>ربحك (رفع سعر)</span>
            <span>{formatPrice(markupProfit)}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-success">
            <span>خصم {appliedCode && `(${appliedCode})`}</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted">رسوم التوصيل</span>
          <span>
            {!governorate
              ? "—"
              : shipping === 0
                ? "مجاني"
                : formatPrice(shipping)}
          </span>
        </div>
        <div className="flex justify-between text-base font-bold pt-1">
          <span>الإجمالي</span>
          <span>{formatPrice(total)}</span>
        </div>
        {freeThreshold != null && (
          <p className="text-xs text-muted leading-relaxed">
            {remainingForFree != null && remainingForFree > 0
              ? `أضف ${formatPrice(remainingForFree)} للحصول على توصيل مجاني (فوق ${formatPrice(freeThreshold)})`
              : `✓ توصيل مجاني للطلبات فوق ${formatPrice(freeThreshold)}`}
            {` · غير ذلك ${formatPrice(shipSettings.fee)}`}
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-sale bg-sale/10 rounded-xl px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || items.length === 0}
        className="btn-primary w-full"
      >
        {loading
          ? "جاري إرسال الطلب..."
          : selfMerchantId
            ? "إرسال طلب المسوق"
            : "إرسال الطلب"}
      </button>
    </form>
  );
}
