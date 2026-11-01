"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchOrderDetail,
  type CustomerOrderDetail,
  type CustomerShipment,
} from "@/lib/order-detail-client";
import {
  orderStatusLabel,
  orderStatusTone,
  ORDER_TIMELINE,
  timelineIndex,
} from "@/lib/order-status";
import { formatPrice } from "@/lib/utils";

/**
 * Customer-only order details — schema-aligned (Phase A, no DB migration).
 * - Server ownership check
 * - Section-based UI
 * - Realtime status updates
 * - Limited retry + offline handling
 */
export default function AccountOrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [shipments, setShipments] = useState<CustomerShipment[]>([]);
  const [headerLoading, setHeaderLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [err, setErr] = useState("");
  const [offline, setOffline] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [live, setLive] = useState(false);

  const retryCount = useRef(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const load = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (!id) return;
      if (!opts?.soft) {
        setHeaderLoading(true);
        setItemsLoading(true);
      }
      setErr("");

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setOffline(true);
        setErr("لا يوجد اتصال بالإنترنت");
        setHeaderLoading(false);
        setItemsLoading(false);
        return;
      }
      setOffline(false);

      try {
        const res = await fetchOrderDetail(id);
        if (!res.ok) {
          setErr(res.error);
          setOrder(null);
          setShipments([]);
          return;
        }
        setOrder(res.order);
        setShipments(res.shipments || []);
        retryCount.current = 0;
      } catch {
        setErr("فشل تحميل الطلب");
      } finally {
        setHeaderLoading(false);
        setItemsLoading(false);
        setRetrying(false);
      }
    },
    [id]
  );

  // Initial load + limited auto-retry
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  // Retry with backoff when error (max 3)
  useEffect(() => {
    if (!err || offline || order) return;
    if (retryCount.current >= 3) return;
    const delays = [1200, 2500, 5000];
    const delay = delays[retryCount.current] || 5000;
    const t = setTimeout(() => {
      retryCount.current += 1;
      setRetrying(true);
      void load({ soft: true });
    }, delay);
    return () => clearTimeout(t);
  }, [err, offline, order, load]);

  // Online / visibility resync
  useEffect(() => {
    const onOnline = () => {
      setOffline(false);
      void load({ soft: true });
    };
    const onOffline = () => setOffline(true);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load({ soft: true });
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // Realtime: status updates only for this order
  useEffect(() => {
    if (!id || !order?.id) return;

    // Clean previous
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`customer-order-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const next = payload.new as {
            status?: string;
            updated_at?: string;
            total?: number;
            shipping?: number;
            discount?: number;
          };
          setOrder((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: next.status || prev.status,
              updatedAt: next.updated_at || prev.updatedAt,
              total: typeof next.total === "number" ? next.total : prev.total,
              shipping:
                typeof next.shipping === "number" ? next.shipping : prev.shipping,
              discount:
                typeof next.discount === "number" ? next.discount : prev.discount,
            };
          });
          setShipments((prev) =>
            prev.map((s) => ({
              ...s,
              status: next.status || s.status,
              updatedAt: next.updated_at || s.updatedAt,
            }))
          );
        }
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
      setLive(false);
    };
  }, [id, order?.id]);

  if (headerLoading && !order) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-40 animate-pulse rounded bg-[#E5EAF1]" />
        <div className="h-28 animate-pulse rounded-2xl bg-[#E5EAF1]" />
        <div className="h-40 animate-pulse rounded-2xl bg-[#E5EAF1]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-[#E4E9F0] bg-white p-6 text-center">
        <p className="text-sm text-[#D64C4C]">{err || "الطلب غير موجود"}</p>
        {offline && (
          <p className="mt-2 text-xs text-[#667085]">تحقق من الاتصال ثم أعد المحاولة</p>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              retryCount.current = 0;
              setRetrying(true);
              void load();
            }}
            className="rounded-xl bg-[#3157D5] px-4 py-2 text-sm font-bold text-white"
          >
            {retrying ? "جاري المحاولة..." : "إعادة المحاولة"}
          </button>
          <Link
            href="/account/orders"
            className="rounded-xl border border-[#E4E9F0] px-4 py-2 text-sm font-semibold text-[#14243A]"
          >
            رجوع للطلبات
          </Link>
        </div>
      </div>
    );
  }

  const step = timelineIndex(order.status);
  const cancelled = order.status === "cancelled" || order.status === "rejected";

  return (
    <div className="space-y-4">
      {/* Nav */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/account/orders" className="text-sm font-semibold text-[#3157D5]">
          ← طلباتي
        </Link>
        <Link
          href={`/account/orders/${order.id}/tracking`}
          className="text-sm font-semibold text-[#18A999]"
        >
          تتبع الشحنة
        </Link>
        {live && (
          <span className="rounded-full bg-[#EFF8F6] px-2 py-0.5 text-[10px] font-semibold text-[#21865B]">
            متصل · تحديث فوري
          </span>
        )}
        {offline && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
            بدون اتصال
          </span>
        )}
      </div>

      {/* Section: Header / status */}
      <section className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-[#718096]">رقم الطلب</p>
            <p className="font-mono text-lg font-bold text-[#14243A]">{order.orderNumber}</p>
            <p className="mt-1 text-xs text-[#718096]">
              {new Date(order.createdAt).toLocaleString("ar-EG")}
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
          <ol className="mt-5 flex flex-wrap gap-2 border-t border-[#E4E9F0] pt-4">
            {ORDER_TIMELINE.map((t, i) => {
              const done = step >= i;
              const current = step === i;
              return (
                <li
                  key={t.key}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    current
                      ? "bg-[#3157D5] text-white"
                      : done
                        ? "bg-[#EEF2FF] text-[#3157D5]"
                        : "bg-[#F6F8FB] text-[#718096]"
                  }`}
                >
                  {t.label}
                </li>
              );
            })}
          </ol>
        )}

        {cancelled && (
          <p className="mt-4 text-sm text-[#D64C4C]">هذا الطلب ملغي أو مرفوض.</p>
        )}
      </section>

      {/* Section: Shipments (single logical shipment until multi-ship schema) */}
      <section className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#14243A]">الشحنات</h2>
        <ul className="mt-3 space-y-2">
          {shipments.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-[#E5EAF1] bg-[#F6F8FB] px-3 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-[#14243A]">{s.label}</p>
                <p className="text-[11px] text-[#718096]">
                  آخر تحديث: {new Date(s.updatedAt).toLocaleString("ar-EG")}
                </p>
              </div>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                  orderStatusTone(s.status)
                }`}
              >
                {orderStatusLabel(s.status)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] leading-5 text-[#718096]">
          التتبع داخلي حسب حالة الطلب. أرقام شركات الشحن تظهر عند تسجيلها من الإدارة.
        </p>
      </section>

      {/* Section: Items + totals */}
      <section className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#14243A]">المنتجات</h2>
        {itemsLoading && !order.items.length ? (
          <p className="mt-3 text-sm text-[#718096]">جاري تحميل المنتجات...</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {order.items.map((item, idx) => (
              <li key={`${item.productId}-${idx}`} className="flex gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#E4E9F0] bg-[#F6F8FB]">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-contain p-0.5"
                      sizes="56px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#202B3C]">{item.name}</p>
                  {item.variant && (
                    <p className="text-xs text-[#718096]">{item.variant}</p>
                  )}
                  <p className="text-xs text-[#718096]">
                    {item.quantity} × {formatPrice(item.price)}
                  </p>
                </div>
                <p className="text-sm font-bold text-[#14243A]">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 space-y-1 border-t border-[#E4E9F0] pt-4 text-sm">
          <div className="flex justify-between text-[#718096]">
            <span>المجموع الفرعي</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-[#21865B]">
              <span>خصم{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-[#718096]">
            <span>التوصيل</span>
            <span>{formatPrice(order.shipping)}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-bold text-[#14243A]">
            <span>الإجمالي</span>
            <span>{formatPrice(order.total)}</span>
          </div>
          <p className="pt-1 text-[11px] text-[#718096]">
            طريقة الدفع:{" "}
            {order.paymentMethod === "cod" || !order.paymentMethod
              ? "الدفع عند الاستلام"
              : order.paymentMethod}
          </p>
        </div>
      </section>

      {/* Section: Delivery address */}
      <section className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#14243A]">عنوان التسليم</h2>
        <p className="mt-2 text-sm leading-7 text-[#526174]">
          <strong>{order.customerName}</strong>
          <br />
          {order.phone}
          {order.phoneAlt ? ` / ${order.phoneAlt}` : ""}
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
      </section>

      {err && order && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {err} — تم عرض آخر بيانات ناجحة.{" "}
          <button
            type="button"
            className="font-bold underline"
            onClick={() => void load({ soft: true })}
          >
            تحديث
          </button>
        </p>
      )}
    </div>
  );
}
