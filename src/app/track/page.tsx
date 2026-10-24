"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, type Order } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";

const statusLabel: Record<string, string> = {
  new: "قيد المراجعة",
  confirmed: "تم التأكيد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

function TrackInner() {
  const sp = useSearchParams();
  const [orderNo, setOrderNo] = useState(sp.get("n") || "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);
    const { data, error: err } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNo.trim())
      .maybeSingle();
    setLoading(false);
    if (err || !data) {
      setError("لم يتم العثور على الطلب");
      return;
    }
    const o = data as Order;
    const p = phone.trim();
    if (p && !o.phone.includes(p.slice(-7)) && !p.includes(o.phone.slice(-7))) {
      setError("رقم التليفون غير مطابق");
      return;
    }
    setOrder(o);
  };

  const field =
    "w-full border border-[#e8e2d9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15";

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">تتبع الطلب</h1>
      <p className="text-sm text-muted mb-6">أدخل رقم الطلب (مثال MQ-XXXX) ورقم التليفون للتأكيد</p>

      <form onSubmit={search} className="space-y-3 mb-8">
        <input
          className={field}
          value={orderNo}
          onChange={(e) => setOrderNo(e.target.value)}
          placeholder="رقم الطلب"
          required
        />
        <input
          className={field}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="رقم التليفون"
          type="tel"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-white py-3 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "جاري البحث..." : "بحث"}
        </button>
      </form>

      {error && <p className="text-sm text-sale mb-4">{error}</p>}

      {order && (
        <div className="bg-white border border-[#e8e2d9] rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-mono font-semibold">{order.order_number}</p>
              <p className="text-sm text-muted">{order.customer_name}</p>
            </div>
            <span className="text-xs font-semibold bg-[#f0ebe3] px-3 py-1 rounded-full">
              {statusLabel[order.status] || order.status}
            </span>
          </div>
          <p className="text-sm text-muted">
            {order.governorate} — {order.center}
          </p>
          <ul className="text-sm space-y-1 border-t border-[#e8e2d9] pt-3">
            {(order.items || []).map((it, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="line-clamp-1">
                  {it.name} × {it.quantity}
                </span>
                <span className="shrink-0">{formatPrice(it.price * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between font-bold border-t border-[#e8e2d9] pt-3">
            <span>الإجمالي</span>
            <span>{formatPrice(Number(order.total))}</span>
          </div>
          <p className="text-xs text-muted">
            {new Date(order.created_at).toLocaleString("ar-EG")}
          </p>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted">...</div>}>
      <TrackInner />
    </Suspense>
  );
}
