"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import {
  DEFAULT_SHIPPING_FEE,
  shippingForGovernorate,
  type ShippingSettings,
} from "@/lib/shipping";
import { validateCoupon } from "@/lib/coupons";
import { getMerchantSession } from "@/lib/merchant";
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        setError("يجب تسجيل الدخول لإتمام الطلب.");
        window.location.href = purchaseLoginHref("/checkout");
        return;
      }

      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        phoneAlt: phoneAlt.trim() || undefined,
        governorate: addressForm.governorate,
        center: addressForm.center,
        area: addressForm.area.trim() || undefined,
        street: addressForm.street.trim() || undefined,
        apartment: addressForm.apartment.trim() || undefined,
        notes: addressForm.notes.trim() || undefined,
        couponCode: appliedCode,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          variant: i.variant,
          price: i.price,
          name: i.name,
          image: i.image,
          basePrice: i.basePrice ?? i.price,
        })),
        merchantId: selfMerchantId,
        refMerchantId: selfMerchantId ? null : refMerchantId,
      };

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            orderNumber?: string;
            duplicate?: boolean;
          }
        | null;

      if (!res.ok || !data?.ok || !data.orderNumber) {
        setError(data?.error || "حدث خطأ أثناء إرسال الطلب");
        submittingRef.current = false;
        setLoading(false);
        return;
      }

      if (refMerchantId && !selfMerchantId) clearMerchantRef();
      notifyOrderWhatsApp(data.orderNumber);
      clearCart();
      router.push(`/order-success?n=${encodeURIComponent(data.orderNumber)}`);
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

  const ctaLabel = selfMerchantId ? "إرسال طلب المسوق" : "تأكيد الطلب وإرساله";

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
      <form onSubmit={onFormSubmit} className="space-y-4 pb-4">
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

        {/* Always-visible order summary on small screens */}
        <div className="lg:hidden">
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

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-[#DC3545]">
            {error}
          </p>
        )}

        {/* Primary CTA — visible on ALL breakpoints */}
        <div className="rounded-[14px] border border-[#E5EAF1] bg-white p-4">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-[#667085]">الإجمالي</span>
            <span className="text-lg font-bold text-[#14243A]">
              {formatPrice(total)}
            </span>
          </div>
          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="flex h-[52px] w-full items-center justify-center rounded-[10px] bg-[#3157D5] text-[16px] font-bold text-white shadow-sm hover:bg-[#2447B8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "جاري إرسال الطلب..." : ctaLabel}
          </button>
          <p className="mt-2 text-center text-[11px] text-[#667085]">
            بالضغط على الزر يتم إرسال طلبك للإدارة · الدفع عند الاستلام
          </p>
        </div>
      </form>

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
        label={ctaLabel}
        onPlaceOrder={() => void submit()}
      />
    </>
  );
}
