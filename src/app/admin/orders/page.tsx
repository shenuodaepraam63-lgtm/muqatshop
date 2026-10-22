"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, type Order } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";

const statusLabel: Record<string, string> = {
  new: "جديد",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setOrders(data as Order[]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-muted text-sm">جاري تحميل الطلبات...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">الطلبات</h1>
      <p className="text-sm text-muted mb-6">اضغط على الاسم لفتح الفاتورة الكاملة</p>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8e2d9] p-12 text-center text-muted">
          لا توجد طلبات بعد
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/orders/${o.id}`}
                className="flex items-center gap-4 bg-white border border-[#e8e2d9] rounded-2xl px-5 py-4 hover:shadow-md hover:border-ink/20 transition group"
              >
                {/* Envelope style */}
                <div className="w-12 h-12 rounded-xl bg-[#f0ebe3] flex items-center justify-center text-xl shrink-0 group-hover:bg-ink group-hover:text-page transition">
                  ✉
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink truncate">{o.customer_name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {o.order_number} · {" "}
                    {new Date(o.created_at).toLocaleString("ar-EG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="text-left shrink-0">
                  <p className="font-bold text-sm">{formatPrice(Number(o.total))}</p>
                  <p className="text-[11px] text-muted">
                    {statusLabel[o.status] || o.status}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
