"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { loadAccountIdentity } from "@/lib/account-identity";
import { fetchCustomerOrder, resolveCustomerId, type CustomerOrder } from "@/lib/customer-account";
import { orderStatusLabel, orderStatusTone, ORDER_TIMELINE, timelineIndex } from "@/lib/order-status";
import { formatPrice } from "@/lib/utils";

type Item = {
  productId?: string;
  name?: string;
  price?: number;
  quantity?: number;
  image?: string;
  variant?: string;
};

export default function AccountOrderDetailPage() {
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

  if (loading) {
    return <p className="text-sm text-[#718096]">جاري التحميل...</p>;
  }

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

  const items = (Array.isArray(order.items) ? order.items : []) as Item[];
  const step = timelineIndex(order.status);
  const cancelled = order.status === "cancelled" || order.status === "rejected";

  return (
    <div className="space-y-4">
      <Link href="/account/orders" className="text-sm font-semibold text-[#3157D5]">
        ← طلباتي
      </Link>

      <div className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-[#718096]">رقم الطلب</p>
            <p className="font-mono text-lg font-bold text-[#14243A]">{order.order_number}</p>
            <p className="mt-1 text-xs text-[#718096]">
              {new Date(order.created_at).toLocaleString("ar-EG", { dateStyle: "full", timeStyle: "short" })}
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${orderStatusTone(order.status)}`}>
            {orderStatusLabel(order.status)}
          </span>
        </div>

        {!cancelled && (
          <ol className="mt-6 space-y-3 border-t border-[#E4E9F0] pt-5">
            {ORDER_TIMELINE.map((t, i) => {
              const done = step >= i;
              return (
                <li key={t.key} className="flex items-center gap-3 text-sm">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                      done ? "bg-[#14243A] text-white" : "bg-[#F6F8FB] text-[#718096]"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={done ? "font-semibold text-[#14243A]" : "text-[#718096]"}>{t.label}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#14243A]">المنتجات</h3>
        <ul className="mt-3 divide-y divide-[#E4E9F0]">
          {items.map((item, i) => (
            <li key={i} className="flex gap-3 py-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#F6F8FB]">
                {item.image ? (
                  <Image src={item.image} alt="" fill className="object-cover" sizes="56px" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#202B3C]">{item.name}</p>
                {item.variant && <p className="text-xs text-[#718096]">{item.variant}</p>}
                <p className="text-xs text-[#718096]">
                  {item.quantity} × {formatPrice(Number(item.price || 0))}
                </p>
              </div>
              <p className="text-sm font-bold text-[#14243A]">
                {formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-[#E4E9F0] pt-4 text-sm">
          <div className="flex justify-between text-[#718096]">
            <span>المجموع الفرعي</span>
            <span>{formatPrice(Number(order.subtotal))}</span>
          </div>
          {Number(order.discount || 0) > 0 && (
            <div className="flex justify-between text-[#21865B]">
              <span>خصم{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
              <span>-{formatPrice(Number(order.discount))}</span>
            </div>
          )}
          <div className="flex justify-between text-[#718096]">
            <span>التوصيل</span>
            <span>{formatPrice(Number(order.shipping))}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-bold text-[#14243A]">
            <span>الإجمالي</span>
            <span>{formatPrice(Number(order.total))}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#14243A]">عنوان التسليم</h3>
        <p className="mt-2 text-sm leading-7 text-[#526174]">
          <strong>{order.customer_name}</strong>
          <br />
          {order.phone}
          {order.phone_alt ? ` / ${order.phone_alt}` : ""}
          <br />
          {order.governorate} — {order.center}
          {order.area ? ` — ${order.area}` : ""}
          {order.street ? (
            <>
              <br />
              شارع: {order.street}
            </>
          ) : null}
          {order.apartment ? (
            <>
              <br />
              شقة/مبنى: {order.apartment}
            </>
          ) : null}
        </p>
        {order.notes && (
          <p className="mt-3 rounded-lg bg-[#F6F8FB] px-3 py-2 text-sm text-[#718096]">
            ملاحظات: {order.notes}
          </p>
        )}
      </div>
    </div>
  );
}
