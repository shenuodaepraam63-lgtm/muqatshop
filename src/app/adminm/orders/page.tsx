"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { onOrderDelivered, onOrderCancelled, releaseMaturedProfits } from "@/lib/merchant";

type Row = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  status: string;
  total: number;
  merchant_profit: number;
  merchant_id: string;
  hold_until: string | null;
  created_at: string;
  merchants?: { name: string } | null;
};

const statuses = [
  { v: "new", l: "قيد المراجعة" },
  { v: "confirmed", l: "مؤكد" },
  { v: "shipped", l: "قيد التوصيل" },
  { v: "delivered", l: "تم التسليم" },
  { v: "cancelled", l: "ملغي" },
];

export default function AdminmOrdersPage() {
  const [orders, setOrders] = useState<Row[]>([]);

  const load = async () => {
    await releaseMaturedProfits();
    const { data } = await supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, phone, status, total, merchant_profit, merchant_id, hold_until, created_at, merchants(name)"
      )
      .not("merchant_id", "is", null)
      .order("created_at", { ascending: false });
    setOrders((data as unknown as Row[]) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (o: Row, status: string) => {
    if (status === "delivered" && o.status !== "delivered") {
      await onOrderDelivered(o.id);
    } else if (status === "cancelled" && o.status !== "cancelled") {
      await onOrderCancelled(o.id);
    } else {
      await supabase.from("orders").update({ status }).eq("id", o.id);
    }
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">طلبات التجار</h1>
      {orders.map((o) => (
        <div key={o.id} className="bg-white border rounded-2xl p-4 text-sm space-y-2">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-mono font-semibold">{o.order_number}</p>
              <p>
                {o.customer_name} · {o.phone}
              </p>
              <p className="text-xs text-muted">
                تاجر: {(o.merchants as { name?: string } | null)?.name || o.merchant_id.slice(0, 8)}
              </p>
            </div>
            <div className="text-left">
              <p className="font-bold">{formatPrice(Number(o.total))}</p>
              <p className="text-xs text-green-700">
                ربح تاجر {formatPrice(Number(o.merchant_profit) || 0)}
              </p>
            </div>
          </div>
          <select
            value={o.status}
            onChange={(e) => setStatus(o, e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm"
          >
            {statuses.map((s) => (
              <option key={s.v} value={s.v}>
                {s.l}
              </option>
            ))}
          </select>
          {o.hold_until && o.status === "delivered" && (
            <p className="text-xs text-amber-700">
              انتظار حتى {new Date(o.hold_until).toLocaleString("ar-EG")}
            </p>
          )}
        </div>
      ))}
      {orders.length === 0 && <p className="text-muted text-sm">لا توجد طلبات تجار</p>}
    </div>
  );
}
