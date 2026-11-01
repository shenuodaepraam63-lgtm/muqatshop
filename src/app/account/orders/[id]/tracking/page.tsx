"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { loadAccountIdentity } from "@/lib/account-identity";
import { fetchCustomerOrder, resolveCustomerId, type CustomerOrder } from "@/lib/customer-account";
import {
  ORDER_TIMELINE,
  orderStatusLabel,
  orderStatusTone,
  timelineIndex,
} from "@/lib/order-status";

/** Tracking uses real order status only — no invented carrier/tracking numbers. */
export default function AccountOrderTrackingPage() {
  const params = useParams();
  const id = params?.id as string;
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const idRes = await loadAccountIdentity();
      if (!idRes.ok) return;
      const customerId = await resolveCustomerId(idRes.identity);
      if (!customerId) {
        setErr("تعذر التحقق من الحساب");
        setLoading(false);
        return;
      }
      const res = await fetchCustomerOrder(id, customerId, idRes.identity.email);
      if (res.error || !res.order) setErr(res.error || "الطلب غير موجود");
      setOrder(res.order);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <p className="text-sm text-[#718096]">جاري التحميل...</p>;

  if (!order) {
    return (
      <div className="rounded-2xl border border-[#E4E9F0] bg-white p-6 text-center">
        <p className="text-sm text-[#D64C4C]">{err || "الطلب غير موجود"}</p>
        <Link href="/account/orders" className="mt-3 inline-block text-sm font-bold text-[#3157D5]">
          رجوع للطلبات
        </Link>
      </div>
    );
  }

  const step = timelineIndex(order.status);
  const cancelled = order.status === "cancelled" || order.status === "rejected";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-sm font-semibold">
        <Link href={`/account/orders/${order.id}`} className="text-[#3157D5]">
          ← تفاصيل الطلب
        </Link>
        <Link href="/account/orders" className="text-[#718096]">
          كل الطلبات
        </Link>
      </div>

      <div className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-[#718096]">تتبع الطلب</p>
            <p className="font-mono text-lg font-bold text-[#14243A]">{order.order_number}</p>
            <p className="mt-1 text-xs text-[#718096]">
              آخر تحديث ظاهر:{" "}
              {new Date(order.updated_at || order.created_at).toLocaleString("ar-EG")}
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${orderStatusTone(order.status)}`}
          >
            {orderStatusLabel(order.status)}
          </span>
        </div>

        {cancelled ? (
          <p className="mt-6 text-sm text-[#D64C4C]">هذا الطلب ملغي أو مرفوض — لا يوجد مسار شحن نشط.</p>
        ) : (
          <ol className="mt-6 space-y-4 border-t border-[#E4E9F0] pt-5">
            {ORDER_TIMELINE.map((t, i) => {
              const done = step >= i;
              const current = step === i;
              return (
                <li key={t.key} className="flex items-start gap-3 text-sm">
                  <span
                    className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      done ? "bg-[#14243A] text-white" : "bg-[#F6F8FB] text-[#718096]"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className={done ? "font-semibold text-[#14243A]" : "text-[#718096]"}>
                      {t.label}
                      {current ? " — الحالة الحالية" : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-6 rounded-xl bg-[#F6F8FB] px-4 py-3 text-sm text-[#718096] leading-7">
          رقم الشحنة وشركة الشحن يظهران هنا فقط عند تسجيلهما من الإدارة على الطلب. لا تُعرض
          بيانات تتبع وهمية.
        </div>
      </div>
    </div>
  );
}
