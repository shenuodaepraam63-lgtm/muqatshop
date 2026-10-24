"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMerchantSession, releaseMaturedProfits } from "@/lib/merchant";
import { formatPrice } from "@/lib/utils";

const labels: Record<string, string> = {
  new: "قيد المراجعة",
  confirmed: "مؤكد",
  shipped: "قيد التوصيل",
  delivered: "تم التسليم",
  cancelled: "ملغي / فاشل",
};

type Row = {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  total: number;
  merchant_profit: number;
  hold_until: string | null;
  profit_released: boolean;
  created_at: string;
};

export default function MerchantOrdersPage() {
  const [orders, setOrders] = useState<Row[]>([]);

  useEffect(() => {
    const s = getMerchantSession();
    if (!s) return;
    (async () => {
      await releaseMaturedProfits(s.id);
      const { data } = await supabase
        .from("orders")
        .select(
          "id, order_number, customer_name, status, total, merchant_profit, hold_until, profit_released, created_at"
        )
        .eq("merchant_id", s.id)
        .order("created_at", { ascending: false });
      setOrders((data as Row[]) || []);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">طلباتي</h1>
      {orders.length === 0 && <p className="text-sm text-muted">لا توجد طلبات</p>}
      {orders.map((o) => {
        const waiting =
          o.status === "delivered" &&
          !o.profit_released &&
          o.hold_until &&
          new Date(o.hold_until) > new Date();
        return (
          <div key={o.id} className="bg-white border rounded-2xl p-4 text-sm">
            <div className="flex justify-between gap-2">
              <span className="font-mono font-semibold">{o.order_number}</span>
              <span className="text-xs bg-[#f0ebe3] px-2 py-0.5 rounded-full">
                {labels[o.status] || o.status}
              </span>
            </div>
            <p className="text-muted mt-1">{o.customer_name}</p>
            <div className="flex justify-between mt-2">
              <span>الإجمالي {formatPrice(Number(o.total))}</span>
              <span className="text-green-700">ربحك {formatPrice(Number(o.merchant_profit) || 0)}</span>
            </div>
            {waiting && (
              <p className="text-xs text-amber-700 mt-2">
                انتظر حتى {new Date(o.hold_until!).toLocaleDateString("ar-EG")} لتحرير العمولة
              </p>
            )}
            {o.profit_released && o.status === "delivered" && (
              <p className="text-xs text-green-700 mt-2">تم تحرير العمولة للمحفظة</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
