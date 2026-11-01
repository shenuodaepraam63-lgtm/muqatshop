"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import {
  orderStatusLabel,
  orderStatusTone,
  ORDER_TIMELINE,
  timelineIndex,
} from "@/lib/order-status";

type TrackItem = {
  name: string;
  quantity: number;
  price: number;
  variant: string | null;
};

type TrackOrder = {
  orderNumber: string;
  status: string;
  customerName: string;
  governorate: string;
  center: string;
  items: TrackItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  couponCode: string | null;
  total: number;
  createdAt: string;
  updatedAt: string;
  paymentMethod: string;
};

function TrackInner() {
  const sp = useSearchParams();
  const [orderNo, setOrderNo] = useState(sp.get("n") || "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);

    if (!orderNo.trim() || !phone.trim()) {
      setError("رقم الطلب ورقم الهاتف مطلوبان");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNo.trim(),
          phone: phone.trim(),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; order?: TrackOrder }
        | null;

      if (!res.ok || !data?.ok || !data.order) {
        setError(data?.error || "لم يتم العثور على طلب بهذه البيانات");
        return;
      }
      setOrder(data.order);
    } catch {
      setError("تعذر الاتصال — حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const field =
    "w-full rounded-xl border border-[#E5EAF1] bg-white px-4 py-3 text-sm outline-none focus:border-[#3157D5]";

  const step = order ? timelineIndex(order.status) : -1;
  const cancelled =
    order?.status === "cancelled" || order?.status === "rejected";

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold text-[#14243A]">تتبع الطلب</h1>
      <p className="mt-2 text-sm leading-7 text-[#667085]">
        أدخل رقم الطلب ورقم الهاتف المسجّل على الطلب. لا يمكن عرض التفاصيل بدون
        تطابق الهاتف.
      </p>

      <form onSubmit={search} className="mt-6 space-y-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#14243A]">
            رقم الطلب *
          </label>
          <input
            className={field}
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            placeholder="مثال: MQ-XXXX"
            required
            autoComplete="off"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#14243A]">
            رقم الهاتف *
          </label>
          <input
            className={field}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            type="tel"
            inputMode="numeric"
            required
            autoComplete="tel"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center rounded-[10px] bg-[#3157D5] text-[15px] font-bold text-white hover:bg-[#2447B8] disabled:opacity-60"
        >
          {loading ? "جاري البحث..." : "تتبع الطلب"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-[#D64C4C]">
          {error}
        </p>
      )}

      {order && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-[#E5EAF1] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-lg font-bold text-[#14243A]">
                  {order.orderNumber}
                </p>
                <p className="mt-1 text-sm text-[#667085]">{order.customerName}</p>
                <p className="text-xs text-[#667085]">
                  {order.governorate} — {order.center}
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  orderStatusTone(order.status)
                }`}
              >
                {orderStatusLabel(order.status)}
              </span>
            </div>

            {!cancelled && (
              <ol className="mt-5 space-y-3 border-t border-[#E5EAF1] pt-4">
                {ORDER_TIMELINE.map((t, i) => {
                  const done = step >= i;
                  const current = step === i;
                  return (
                    <li key={t.key} className="flex items-center gap-2 text-sm">
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${
                          done
                            ? "bg-[#14243A] text-white"
                            : "bg-[#F6F8FB] text-[#718096]"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={
                          current
                            ? "font-semibold text-[#3157D5]"
                            : done
                              ? "text-[#14243A]"
                              : "text-[#718096]"
                        }
                      >
                        {t.label}
                        {current ? " — الحالية" : ""}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            {cancelled && (
              <p className="mt-4 text-sm text-[#D64C4C]">هذا الطلب ملغي أو مرفوض.</p>
            )}

            <p className="mt-4 text-[11px] text-[#718096]">
              آخر تحديث: {new Date(order.updatedAt).toLocaleString("ar-EG")}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E5EAF1] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#14243A]">المنتجات</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {order.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="min-w-0">
                    <span className="line-clamp-1 font-medium text-[#14243A]">
                      {it.name}
                    </span>
                    {it.variant && (
                      <span className="block text-[11px] text-[#718096]">
                        {it.variant}
                      </span>
                    )}
                    <span className="text-xs text-[#718096]">× {it.quantity}</span>
                  </span>
                  <span className="shrink-0 font-semibold">
                    {formatPrice(it.price * it.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-[#E5EAF1] pt-3 text-sm">
              {order.discount > 0 && (
                <div className="flex justify-between text-[#21865B]">
                  <span>خصم</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#667085]">
                <span>التوصيل</span>
                <span>{formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between font-bold text-[#14243A]">
                <span>الإجمالي</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-[#667085]">
            لديك حساب؟{" "}
            <Link href="/account/orders" className="font-semibold text-[#3157D5]">
              عرض الطلبات من الحساب
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-[#667085]">جاري التحميل...</div>
      }
    >
      <TrackInner />
    </Suspense>
  );
}
