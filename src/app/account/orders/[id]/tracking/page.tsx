"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchOrderDetail, type CustomerOrderDetail } from "@/lib/order-detail-client";
import {
  ORDER_TIMELINE,
  orderStatusLabel,
  orderStatusTone,
  timelineIndex,
} from "@/lib/order-status";

/** Customer tracking — real status only, server ownership check. */
export default function AccountOrderTrackingPage() {
  const params = useParams();
  const id = params?.id as string;
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr("");
    const res = await fetchOrderDetail(id);
    if (!res.ok) {
      setErr(res.error);
      setOrder(null);
    } else {
      setOrder(res.order);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!id || !order?.id) return;
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    const channel = supabase
      .channel(`customer-track-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const next = payload.new as { status?: string; updated_at?: string };
          setOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: next.status || prev.status,
                  updatedAt: next.updated_at || prev.updatedAt,
                }
              : prev
          );
        }
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    channelRef.current = channel;
    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
      setLive(false);
    };
  }, [id, order?.id]);

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
        {live && (
          <span className="rounded-full bg-[#EFF8F6] px-2 py-0.5 text-[10px] font-semibold text-[#21865B]">
            متصل
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-[#718096]">تتبع الطلب</p>
            <p className="font-mono text-lg font-bold text-[#14243A]">{order.orderNumber}</p>
            <p className="mt-1 text-xs text-[#718096]">
              آخر تحديث: {new Date(order.updatedAt).toLocaleString("ar-EG")}
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

        {cancelled ? (
          <p className="mt-6 text-sm text-[#D64C4C]">
            هذا الطلب ملغي أو مرفوض — لا يوجد مسار شحن نشط.
          </p>
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

        <div className="mt-6 rounded-xl bg-[#F6F8FB] px-4 py-3 text-sm leading-7 text-[#718096]">
          التتبع داخلي حسب حالة الطلب من الإدارة. لا تُعرض بيانات شحن وهمية.
        </div>
      </div>
    </div>
  );
}
