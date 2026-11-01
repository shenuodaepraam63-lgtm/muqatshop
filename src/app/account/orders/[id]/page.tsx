"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchOrderDetail,
  fetchOrderEvents,
  type CustomerOrderDetail,
} from "@/lib/order-detail-client";
import type { OrderShipment, OrderStatusEvent } from "@/lib/order-foundation";
import { useOrderRealtime } from "@/lib/use-order-realtime";
import {
  orderStatusLabel,
  orderStatusTone,
  ORDER_TIMELINE,
  timelineIndex,
} from "@/lib/order-status";
import { formatPrice } from "@/lib/utils";

export default function AccountOrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [shipments, setShipments] = useState<OrderShipment[]>([]);
  const [events, setEvents] = useState<OrderStatusEvent[]>([]);
  const [eventsCursor, setEventsCursor] = useState<string | null>(null);
  const [loadingMoreEvents, setLoadingMoreEvents] = useState(false);
  const [headerLoading, setHeaderLoading] = useState(true);
  const [err, setErr] = useState("");
  const [offline, setOffline] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const retryCount = useRef(0);

  const load = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (!id) return;
      if (!opts?.soft) setHeaderLoading(true);
      setErr("");

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setOffline(true);
        setErr("لا يوجد اتصال بالإنترنت");
        setHeaderLoading(false);
        return;
      }
      setOffline(false);

      try {
        const res = await fetchOrderDetail(id);
        if (!res.ok) {
          setErr(res.error);
          setOrder(null);
          setShipments([]);
          setEvents([]);
          return;
        }
        setOrder(res.order);
        setShipments(res.shipments || []);
        setEvents(res.events || []);
        setEventsCursor(res.eventsNextCursor);
        retryCount.current = 0;
      } catch {
        setErr("فشل تحميل الطلب");
      } finally {
        setHeaderLoading(false);
        setRetrying(false);
      }
    },
    [id]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!err || offline || order) return;
    if (retryCount.current >= 3) return;
    const delays = [1200, 2500, 5000];
    const t = setTimeout(() => {
      retryCount.current += 1;
      setRetrying(true);
      void load({ soft: true });
    }, delays[retryCount.current] || 5000);
    return () => clearTimeout(t);
  }, [err, offline, order, load]);

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

  const { live } = useOrderRealtime(order?.id, (patch) => {
    setOrder((prev) =>
      prev
        ? {
            ...prev,
            status: patch.status || prev.status,
            updatedAt: patch.updated_at || prev.updatedAt,
            version: patch.version ?? prev.version,
          }
        : prev
    );
    setShipments((prev) =>
      prev.map((s, i) =>
        i === 0
          ? {
              ...s,
              status: patch.status || s.status,
              updatedAt: patch.updated_at || s.updatedAt,
            }
          : s
      )
    );
    if (id) {
      void fetchOrderDetail(id).then((res) => {
        if (res.ok) {
          setEvents(res.events || []);
          setEventsCursor(res.eventsNextCursor);
          setShipments(res.shipments || []);
        }
      });
    }
  });

  const loadMoreEvents = async () => {
    if (!id || !eventsCursor || loadingMoreEvents) return;
    setLoadingMoreEvents(true);
    const res = await fetchOrderEvents(id, eventsCursor);
    if (res.ok) {
      setEvents((prev) => [...prev, ...res.events]);
      setEventsCursor(res.nextCursor);
    }
    setLoadingMoreEvents(false);
  };

  if (headerLoading && !order) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-40 animate-pulse rounded bg-[#E5EAF1]" />
        <div className="h-28 animate-pulse rounded-2xl bg-[#E5EAF1]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-[#E4E9F0] bg-white p-6 text-center">
        <p className="text-sm text-[#D64C4C]">{err || "الطلب غير موجود"}</p>
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
            className="rounded-xl border border-[#E4E9F0] px-4 py-2 text-sm font-semibold"
          >
            رجوع
          </Link>
        </div>
      </div>
    );
  }

  const step = timelineIndex(order.status);
  const cancelled = order.status === "cancelled" || order.status === "rejected";

  return (
    <div className="space-y-4">
      {lightbox && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
          aria-label="إغلاق"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
          />
        </button>
      )}

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
      </section>

      <section className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#14243A]">الشحنات</h2>
        <ul className="mt-3 space-y-2">
          {shipments.map((s) => (
            <li key={s.id} className="rounded-xl border border-[#E5EAF1] bg-[#F6F8FB] px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#14243A]">{s.label}</p>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                    orderStatusTone(s.status)
                  }`}
                >
                  {orderStatusLabel(s.status)}
                </span>
              </div>
              {s.trackingNumber && (
                <p className="mt-1 text-xs text-[#526174]">
                  تتبع: {s.trackingNumber}
                  {s.carrier ? ` · ${s.carrier}` : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#14243A]">سجل التحديثات</h2>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-[#718096]">لا توجد أحداث مسجّلة بعد</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {events.map((ev) => (
              <li key={ev.id} className="flex gap-3 text-sm">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#3157D5]" />
                <div>
                  <p className="font-medium text-[#14243A]">
                    {orderStatusLabel(ev.toStatus)}
                    {ev.fromStatus ? (
                      <span className="font-normal text-[#718096]">
                        {" "}(من {orderStatusLabel(ev.fromStatus)})
                      </span>
                    ) : null}
                  </p>
                  {ev.note && <p className="text-xs text-[#526174]">{ev.note}</p>}
                  <p className="text-[11px] text-[#718096]">
                    {new Date(ev.createdAt).toLocaleString("ar-EG")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {eventsCursor && (
          <button
            type="button"
            onClick={() => void loadMoreEvents()}
            disabled={loadingMoreEvents}
            className="mt-3 w-full rounded-xl border border-[#E5EAF1] py-2 text-sm font-semibold text-[#3157D5]"
          >
            {loadingMoreEvents ? "جاري التحميل..." : "تحميل المزيد"}
          </button>
        )}
      </section>

      <section className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#14243A]">المنتجات</h2>
        <ul className="mt-3 space-y-3">
          {order.items.map((item, idx) => (
            <li key={`${item.productId}-${idx}`} className="flex gap-3">
              <button
                type="button"
                className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#E4E9F0] bg-[#F6F8FB]"
                onClick={() => item.image && setLightbox(item.image)}
                disabled={!item.image}
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    className="object-contain p-0.5"
                    sizes="56px"
                    loading="lazy"
                  />
                ) : null}
              </button>
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
        </div>
      </section>

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
    </div>
  );
}
