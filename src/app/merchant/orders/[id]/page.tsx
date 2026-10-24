"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMerchantSession } from "@/lib/merchant";
import { formatPrice } from "@/lib/utils";

const labels: Record<string, string> = {
  new: "قيد المراجعة",
  confirmed: "مؤكد",
  shipped: "قيد التوصيل",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

type OrderDetail = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  governorate: string;
  center: string;
  area: string | null;
  street: string | null;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  merchant_profit: number;
  hold_until: string | null;
  profit_released: boolean;
  items: {
    name: string;
    price: number;
    quantity: number;
    basePrice?: number;
  }[];
  created_at: string;
  notes: string | null;
};

export default function MerchantOrderDetailPage() {
  const params = useParams();
  const id = String(params.id || "");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const s = getMerchantSession();
    if (!s || !id) return;
    (async () => {
      const { data } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      if (!data || data.merchant_id !== s.id) {
        setDenied(true);
        return;
      }
      setOrder(data as OrderDetail);
    })();
  }, [id]);

  if (denied) {
    return (
      <div className="text-sm text-muted">
        غير مسموح. <Link href="/merchant/orders" className="underline">رجوع</Link>
      </div>
    );
  }

  if (!order) {
    return <p className="text-sm text-muted">جاري التحميل...</p>;
  }

  return (
    <div className="space-y-4">
      <Link href="/merchant/orders" className="text-sm text-muted">
        ← طلباتي
      </Link>
      <div className="bg-white border rounded-2xl p-5 space-y-3 text-sm">
        <div className="flex justify-between gap-2">
          <p className="font-mono font-bold">{order.order_number}</p>
          <span className="text-xs bg-[#f0ebe3] px-2 py-1 rounded-full">
            {labels[order.status] || order.status}
          </span>
        </div>
        <p className="text-muted text-xs">
          {new Date(order.created_at).toLocaleString("ar-EG")}
        </p>
        <div className="border-t border-[#eee] pt-3">
          <p className="font-semibold">{order.customer_name}</p>
          <p>{order.phone}</p>
          <p className="text-muted">
            {order.governorate} — {order.center}
            {order.area ? ` — ${order.area}` : ""}
            {order.street ? ` — ${order.street}` : ""}
          </p>
        </div>
        <ul className="border-t border-[#eee] pt-3 space-y-2">
          {(order.items || []).map((it, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span className="line-clamp-2">
                {it.name} × {it.quantity}
              </span>
              <span className="shrink-0">{formatPrice(it.price * it.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-[#eee] pt-3 space-y-1">
          <div className="flex justify-between">
            <span className="text-muted">المنتجات</span>
            <span>{formatPrice(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">الشحن</span>
            <span>{formatPrice(Number(order.shipping))}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>الإجمالي</span>
            <span>{formatPrice(Number(order.total))}</span>
          </div>
          <div className="flex justify-between text-green-700">
            <span>ربحك</span>
            <span>{formatPrice(Number(order.merchant_profit) || 0)}</span>
          </div>
          {order.status === "delivered" && !order.profit_released && order.hold_until && (
            <p className="text-xs text-amber-700 pt-1">
              تحرير العمولة بعد {new Date(order.hold_until).toLocaleDateString("ar-EG")}
            </p>
          )}
          {order.profit_released && (
            <p className="text-xs text-green-700 pt-1">تم تحرير العمولة للمحفظة</p>
          )}
        </div>
        {order.notes && (
          <p className="text-xs text-muted border-t pt-2">{order.notes}</p>
        )}
      </div>
    </div>
  );
}
