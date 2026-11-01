"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import {
  DEFAULT_SHIPPING_FEE,
  calcShipping,
  shippingForGovernorate,
  type ShippingSettings,
} from "@/lib/shipping";
import { validateCoupon, incrementCouponUse } from "@/lib/coupons";
import { decrementStockForItems } from "@/lib/stock";
import { getMerchantSession, getMerchantSettings } from "@/lib/merchant";
import { getMerchantRef, clearMerchantRef } from "@/lib/merchant-ref";
import { notifyOrderWhatsApp } from "@/lib/whatsapp/client-notify";
import { loadAccountIdentity } from "@/lib/account-identity";
import {
  resolveCustomerId,
  type CustomerAddress,
} from "@/lib/customer-account";
import { syncCustomerFromAuthUser } from "@/lib/auth-customer";
import { ensureCanPurchaseAsync, purchaseLoginHref } from "@/lib/purchase-guard";

import { CustomerInformation } from "./CustomerInformation";
import {
  AddressSelector,
  type AddressFormState,
} from "./AddressSelector";
import { ShippingMethodSelector } from "./ShippingMethodSelector";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { CouponSection } from "./CouponSection";
import { OrderSummaryPanel } from "./OrderSummaryPanel";
import { MobileCheckoutBar } from "./MobileCheckoutBar";

const emptyAddress: AddressFormState = {
  governorate: "",
  center: "",
  area: "",
  street: "",
  apartment: "",
  notes: "",
};

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
  const [phone, setPhone] = useState("");
  const [phoneAlt, setPhoneAlt] = useState("");
  const [addressForm, setAddressForm] = useState<AddressFormState>(emptyAddress);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [canCheckout, setCanCheckout] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const [shipSettings, setShipSettings] = useState<ShippingSettings>({
    fee: DEFAULT_SHIPPING_FEE,
    free_over: 1000,
  });
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState("");

  // Auth + identity + addresses
  useEffect(() => {
    (async () => {
      const ok = await ensureCanPurchaseAsync();
      setCanCheckout(ok);
      setAuthReady(true);
      if (!ok) return;

      const merchant = getMerchantSession();
      if (merchant) {
        setSelfMerchantId(merchant.id);
        setSelfMerchantName(merchant.name);
      } else {
        const ref = getMerchantRef();
        if (ref) {
          setRefMerchantId(ref.merchantId);
          setRefMerchantName(ref.name || null);
        }

        const idRes = await loadAccountIdentity();
        if (idRes.ok) {
          setAccountEmail(idRes.identity.email);
          if (idRes.identity.fullName) setFullName(idRes.identity.fullName);
          if (idRes.identity.phone) setPhone(idRes.identity.phone);

          await syncCustomerFromAuthUser({
            name: idRes.identity.fullName || undefined,
          }).catch(() => null);

          const cid = await resolveCustomerId(idRes.identity);
          setCustomerId(cid);

          if (cid) {
            setLoadingAddresses(true);
            const { data } = await supabase
              .from("customer_addresses")
              .select("*")
              .eq("customer_id", cid)
              .order("is_default", { ascending: false })
              .order("created_at", { ascending: false });
            const rows = (data as CustomerAddress[]) || [];
            setSavedAddresses(rows);
            const def = rows.find((r) => r.is_default) || rows[0];
            if (def) applySavedAddress(def);
            setLoadingAddresses(false);
          }
        }
      }

      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "shipping")
        .maybeSingle();
      if (data?.value && typeof data.value === "object") {
        const v = data.value as {
          fee?: number;
          free_over?: number | null;
          by_governorate?: Record<string, number>;
        };
        setShipSettings({
          fee: typeof v.fee === "number" ? v.fee : DEFAULT_SHIPPING_FEE,
          free_over: typeof v.free_over === "number" ? v.free_over : 1000,
          by_governorate: v.by_governorate,
        });
      }
    })();
  }, []);

  const applySavedAddress = (addr: CustomerAddress) => {
    setSelectedAddressId(addr.id);
    setFullName(addr.full_name || fullName);
    setPhone(addr.phone || phone);
    if (addr.phone_alt) setPhoneAlt(addr.phone_alt);
    setAddressForm({
      governorate: addr.governorate,
      center: addr.center,
      area: addr.area || "",
      street: addr.street || "",
      apartment: addr.apartment || "",
      notes: "",
    });
  };

  const onSelectSaved = (addr: CustomerAddress | null) => {
    if (!addr) {
      setSelectedAddressId(null);
      setAddressForm(emptyAddress);
      return;
    }
    applySavedAddress(addr);
  };

  const onAddressField = (field: keyof AddressFormState, value: string) => {
    setSelectedAddressId(null);
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = addressForm.governorate
    ? shippingForGovernorate(addressForm.governorate, afterDiscount, shipSettings)
    : 0;
  const total = afterDiscount + shipping;

  const freeThreshold = shipSettings.free_over;
  const remainingForFree =
    freeThreshold != null ? Math.max(0, freeThreshold - afterDiscount) : null;
  const freeShippingHint =
    freeThreshold == null
      ? null
      : remainingForFree != null && remainingForFree > 0
        ? `أضف ${formatPrice(remainingForFree)} للحصول على توصيل مجاني (فوق ${formatPrice(freeThreshold)})`
        : `✓ توصيل مجاني للطلبات فوق ${formatPrice(freeThreshold)}`;

  const markupProfit = selfMerchantId
    ? Math.max(0, subtotal - baseSubtotal)
    : 0;

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

  const submit = async () => {
    setError("");
    if (submittingRef.current) return;

    const allowed = await ensureCanPurchaseAsync();
    if (!allowed) {
      window.location.href = purchaseLoginHref("/checkout");
      return;
    }

    if (!fullName.trim() || !addressForm.governorate || !addressForm.center || !phone.trim()) {
      setError("من فضلك أكمل الحقول المطلوبة (الاسم · الهاتف · المحافظة · المركز)");
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
      const ship = shippingForGovernorate(
        addressForm.governorate,
        net,
        shipSettings
      );
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
      if (addressForm.notes.trim()) noteParts.push(addressForm.notes.trim());
      if (selfMerchantId && selfMerchantName)
        noteParts.push(`طلب تاجر: ${selfMerchantName}`);
      if (!selfMerchantId && refMerchantId)
        noteParts.push(
          `إحالة تاجر: ${refMerchantName || refMerchantId.slice(0, 8)}`
        );

      let linkedCustomerId: string | null = customerId;
      let linkedCustomerEmail: string | null = accountEmail;

      if (!selfMerchantId) {
        const idRes = await loadAccountIdentity();
        if (!idRes.ok) {
          setError("يجب تسجيل الدخول لإتمام الطلب.");
          window.location.href = purchaseLoginHref("/checkout");
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
      }

      const payload: Record<string, unknown> = {
        order_number: orderNumber,
        customer_name: fullName.trim(),
        governorate: addressForm.governorate,
        center: addressForm.center,
        area: addressForm.area.trim() || null,
        street: addressForm.street.trim() || null,
        apartment: addressForm.apartment.trim() || null,
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
        payment_method: "cod",
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

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit();
  };

  if (!authReady) {
    return (
      <div className="rounded-[14px] border border-[#E5EAF1] bg-white p-5 text-sm text-[#667085]">
        جاري التحقق من الجلسة...
      </div>
    );
  }

  if (!canCheckout) {
    return (
      <div className="rounded-[14px] border border-[#E5EAF1] bg-white p-6 text-center">
        <h2 className="text-lg font-bold text-[#14243A]">
          إتمام الطلب يتطلب حسابًا
        </h2>
        <p className="mt-2 text-sm leading-7 text-[#667085]">
          سجّل الدخول أو أنشئ حسابًا لإكمال الطلب — السلة محفوظة على هذا الجهاز.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <a
            href={purchaseLoginHref("/checkout")}
            className="inline-flex h-12 items-center justify-center rounded-[10px] bg-[#3157D5] px-6 text-[15px] font-bold text-white"
          >
            تسجيل الدخول
          </a>
          <a
            href="/register/customer"
            className="inline-flex h-12 items-center justify-center rounded-[10px] border border-[#E5EAF1] px-6 text-[15px] font-semibold text-[#14243A]"
          >
            إنشاء حساب
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={onFormSubmit} className="space-y-4">
        <CustomerInformation
          fullName={fullName}
          phone={phone}
          phoneAlt={phoneAlt}
          email={accountEmail}
          isMerchantOrder={!!selfMerchantId}
          onChange={(field, value) => {
            if (field === "fullName") setFullName(value);
            if (field === "phone") setPhone(value);
            if (field === "phoneAlt") setPhoneAlt(value);
          }}
        />

        <AddressSelector
          addresses={savedAddresses}
          selectedAddressId={selectedAddressId}
          form={addressForm}
          loadingAddresses={loadingAddresses}
          onSelectSaved={onSelectSaved}
          onFormChange={onAddressField}
        />

        <ShippingMethodSelector
          governorate={addressForm.governorate}
          shippingFee={shipping}
        />

        <PaymentMethodSelector />

        <CouponSection
          code={couponCode}
          appliedCode={appliedCode}
          message={couponMsg}
          disabled={!!selfMerchantId}
          onCodeChange={setCouponCode}
          onApply={applyCoupon}
          onClear={clearCoupon}
        />

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-[#DC3545]">
            {error}
          </p>
        )}

        {/* Desktop place order */}
        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="hidden h-[52px] w-full rounded-[10px] bg-[#3157D5] text-[15px] font-bold text-white hover:bg-[#2447B8] disabled:opacity-60 md:block"
        >
          {loading
            ? "جاري إرسال الطلب..."
            : selfMerchantId
              ? "إرسال طلب المسوق"
              : "تأكيد الطلب"}
        </button>
      </form>

      {/* Desktop sticky summary is rendered by parent page; mobile bar here */}
      <div className="mt-4 hidden lg:block">
        <OrderSummaryPanel
          items={items}
          subtotal={subtotal}
          discount={discount}
          shipping={shipping}
          total={total}
          governorate={addressForm.governorate}
          appliedCode={appliedCode}
          markupProfit={markupProfit}
          freeShippingHint={freeShippingHint}
        />
      </div>

      <MobileCheckoutBar
        total={total}
        loading={loading}
        disabled={items.length === 0}
        label={selfMerchantId ? "إرسال طلب المسوق" : "تأكيد الطلب"}
        onPlaceOrder={() => void submit()}
      />
    </>
  );
}
