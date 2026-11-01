"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import {
  fetchOrderDetail,
  fetchOrderEvents,
  type CustomerOrderDetail,
} from "@/lib/order-detail-client";
import type { OrderShipment, OrderStatusEvent } from "@/lib/order-foundation";
import { useOrderRealtime } from "@/lib/use-order-realtime";

function SectionSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-[#E5EAF1] bg-white p-5 ${className}`}
    >
      <div className="mb-4 h-4 w-32 rounded bg-[#E8EDF5]" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-[#E8EDF5]" />
        <div className="h-3 w-4/5 rounded bg-[#E8EDF5]" />
        <div className="h-3 w-2/3 rounded bg-[#E8EDF5]" />
      </div>
    </div>
  );
}

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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="order-2 space-y-4 lg:order-1">
          <SectionSkeleton className="h-48" />
          <SectionSkeleton className="h-40" />
          <SectionSkeleton className="h-56" />
        </div>
        <div className="order-1 space-y-4 lg:order-2">
          <SectionSkeleton className="h-44" />
          <SectionSkeleton className="h-36" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-[#E4E9F0] bg-white p-6 text-center shadow-sm">
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
            className="rounded-xl bg-[#3157D5] px-4 py-2.5 text-sm font-bold text-white"
          >
            {retrying ? "جاري المحاولة..." : "إعادة المحاولة"}
          </button>
          <Link
            href="/account/orders"
            className="rounded-xl border border-[#E4E9F0] px-4 py-2.5 text-sm font-semibold text-[#14243A]"
          >
            رجوع للطلبات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <OrderDetailView
      order={order}
      shipments={shipments}
      events={events}
      eventsCursor={eventsCursor}
      loadingMoreEvents={loadingMoreEvents}
      onLoadMoreEvents={() => void loadMoreEvents()}
      live={live}
      offline={offline}
    />
  );
}
