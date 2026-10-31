"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadAccountIdentity } from "@/lib/account-identity";
import { fetchCustomerOrders, resolveCustomerId, type CustomerOrder } from "@/lib/customer-account";
import { orderStatusLabel, orderStatusTone } from "@/lib/order-status";
import { formatPrice } from "@/lib/utils";

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    (async () => {
      const idRes = await loadAccountIdentity();
      if (!idRes.ok) return;
      const customerId = await resolveCustomerId(idRes.identity);
      if (!customerId) {
        setErr("تعذر ربط حساب العميل");
        setLoading(false);
        return;
      }
      const res = await fetchCustomerOrders(customerId, idRes.identity.email);
      if (res.error) setErr(res.error);
      setOrders(res.orders);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchQ =
        !q.trim() ||
        o.order_number.toLowerCase().includes(q.trim().toLowerCase());
      const matchS = status === "all" || o.status === status;
      return matchQ && matchS;
    });
  }, [orders, q, status]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[#14243A]">طلباتي</h2>
        <p className="mt-1 text-sm text-[#718096]">عرض طلباتك المرتبطة بحسابك فقط.</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="w-full rounded-xl border border-[#E4E9F0] bg-white px-3 py-2.5 text-sm"
          placeholder="بحث برقم الطلب"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          dir="ltr"
        />
        <select
          className="rounded-xl border border-[#E4E9F0] bg-white px-3 py-2.5 text-sm sm:w-48"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">كل الحالات</option>
          <option value="new">جديد</option>
          <option value="confirmed">مؤكد</option>
          <option value="shipped">تم الشحن</option>
          <option value="delivered">تم التسليم</option>
          <option value="cancelled">ملغي</option>
        </select>
      </div>

      {loading && <p className="text-sm text-[#718096]">جاري التحميل...</p>}
      {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-[#D64C4C]">{err}</p>}

      {!loading && !filtered.length && (
        <div className="rounded-2xl border border-dashed border-[#D6DDEA] bg-white px-4 py-10 text-center">
          <p className="font-semibold text-[#14243A]">لا توجد طلبات</p>
          <Link href="/shop" className="mt-3 inline-block text-sm font-bold text-[#3157D5]">
            ابدأ التسوق
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {filtered.map((o) => (
          <li key={o.id}>
            <Link
              href={`/account/orders/${o.id}`}
              className="block rounded-2xl border border-[#E4E9F0] bg-white p-4 shadow-sm transition hover:border-[#C8D6FF]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-sm font-bold text-[#14243A]">{o.order_number}</p>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${orderStatusTone(o.status)}`}>
                  {orderStatusLabel(o.status)}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#718096]">
                {new Date(o.created_at).toLocaleString("ar-EG")}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#14243A]">{formatPrice(Number(o.total))}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
