"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Truck,
  XCircle,
} from "lucide-react";
import type { CustomerOrderDetail } from "@/lib/order-detail-client";
import type { OrderShipment, OrderStatusEvent } from "@/lib/order-foundation";
import {
  ORDER_TIMELINE,
  orderStatusLabel,
  orderStatusTone,
  timelineIndex,
} from "@/lib/order-status";
import { formatPrice } from "@/lib/utils";
import { buildSupportWhatsAppUrl } from "@/lib/support-contact";

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function eventTimeForStage(
  events: OrderStatusEvent[],
  stageKey: string
): string | null {
  const matchKeys =
    stageKey === "processing"
      ? ["processing", "preparing"]
      : stageKey === "shipped"
        ? ["shipped", "out_for_delivery"]
        : [stageKey];
  const found = events.find((e) => matchKeys.includes(e.toStatus));
  return found?.createdAt || null;
}

function ProductImage({
  src,
  onOpen,
}: {
  src: string | null;
  onOpen: () => void;
}) {
  if (!src) {
    return (
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-[#E5EAF1] bg-[#F6F8FB]">
        <Package className="h-6 w-6 text-[#3157D5]/60" strokeWidth={1.75} />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#E5EAF1] bg-[#F6F8FB] transition hover:opacity-90"
      aria-label="عرض الصورة"
    >
      <Image src={src} alt="" fill className="object-contain p-1" sizes="64px" loading="lazy" />
    </button>
  );
}

function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#14243A] px-4 py-2 text-sm font-medium text-white shadow-lg md:bottom-8"
    >
      {message}
    </div>
  );
}

type Props = {
  order: CustomerOrderDetail;
  shipments: OrderShipment[];
  events: OrderStatusEvent[];
  eventsCursor: string | null;
  loadingMoreEvents: boolean;
  onLoadMoreEvents: () => void;
  live?: boolean;
  offline?: boolean;
};

export function OrderDetailView({
  order,
  shipments,
  events,
  eventsCursor,
  loadingMoreEvents,
  onLoadMoreEvents,
  live,
  offline,
}: Props) {
  const [openStage, setOpenStage] = useState<string | null>(null);
  const [openShip, setOpenShip] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const cancelled =
    order.status === "cancelled" || order.status === "rejected";
  const step = timelineIndex(order.status);
  const lastUpdate = order.updatedAt || order.createdAt;

  const sortedShipments = useMemo(() => {
    const rank = (s: string) => {
      if (s === "cancelled" || s === "rejected") return 4;
      if (s === "delivered") return 3;
      if (s === "shipped" || s === "out_for_delivery") return 1;
      return 2;
    };
    return [...shipments].sort((a, b) => rank(a.status) - rank(b.status));
  }, [shipments]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const copyText = async (text: string, okMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(okMsg);
    } catch {
      showToast("تعذر النسخ");
    }
  };

  const fullAddress = [
    order.governorate,
    order.center,
    order.area,
    order.street ? `شارع: ${order.street}` : null,
    order.apartment ? `شقة/مبنى: ${order.apartment}` : null,
  ]
    .filter(Boolean)
    .join(" — ");

  const waUrl = buildSupportWhatsAppUrl({
    fullName: order.customerName,
    orderNumber: order.orderNumber,
    topic: "استفسار عن طلب",
  });

  const iconWrap = (tone: "navy" | "blue" | "teal" | "amber" | "red") => {
    const map = {
      navy: "bg-[#EEF1F6] text-[#14243A]",
      blue: "bg-[#EEF3FF] text-[#3157D5]",
      teal: "bg-[#EFF8F6] text-[#18A999]",
      amber: "bg-amber-50 text-amber-700",
      red: "bg-red-50 text-[#D64C4C]",
    };
    return `inline-grid h-10 w-10 place-items-center rounded-full ${map[tone]}`;
  };

  return (
    <div className="space-y-4 pb-8">
      <Toast message={toast} />

      {lightbox && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 motion-safe:animate-in"
          onClick={() => setLightbox(null)}
          aria-label="إغلاق الصورة"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
          />
        </button>
      )}

      {/* Nav */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/account/orders" className="font-semibold text-[#3157D5]">
          ← طلباتي
        </Link>
        <Link
          href={`/account/orders/${order.id}/tracking`}
          className="font-semibold text-[#18A999]"
        >
          تتبع مفصل
        </Link>
        {live && (
          <span className="rounded-full bg-[#EFF8F6] px-2.5 py-0.5 text-[10px] font-semibold text-[#21865B]">
            متصل · تحديث فوري
          </span>
        )}
        {offline && (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
            بدون اتصال
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        {/* ========== Main column ========== */}
        <div className="order-2 space-y-4 lg:order-1">
          {/* Journey — desktop/tablet in main; on mobile after summary via order classes below */}
          <section className="hidden rounded-2xl border border-[#E5EAF1] bg-white p-5 shadow-sm sm:p-6 lg:block">
            <JourneyBlock
              order={order}
              events={events}
              step={step}
              cancelled={cancelled}
              lastUpdate={lastUpdate}
              openStage={openStage}
              setOpenStage={setOpenStage}
              eventTimeForStage={eventTimeForStage}
              formatDateTime={formatDateTime}
              eventsCursor={eventsCursor}
              loadingMoreEvents={loadingMoreEvents}
              onLoadMoreEvents={onLoadMoreEvents}
            />
          </section>

          {/* Shipments */}
          <section className="rounded-2xl border border-[#E5EAF1] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className={iconWrap("blue")}>
                <Truck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-[#14243A]">الشحنات</h2>
                <p className="text-xs text-[#718096]">
                  {sortedShipments.length} شحنة · التتبع داخلي من Muqatshop
                </p>
              </div>
            </div>

            <ul className="space-y-3">
              {sortedShipments.map((s, idx) => {
                const open = openShip === s.id;
                return (
                  <li
                    key={s.id}
                    className="overflow-hidden rounded-2xl border border-[#E5EAF1] bg-[#FAFBFC]"
                  >
                    <button
                      type="button"
                      className="flex w-full flex-col gap-2 p-4 text-right transition hover:bg-white"
                      onClick={() => setOpenShip(open ? null : s.id)}
                      aria-expanded={open}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-bold text-[#14243A]">
                            {s.label || `شحنة ${idx + 1}`}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#718096]">
                            آخر تحديث: {formatDateTime(s.updatedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                              orderStatusTone(s.status)
                            }`}
                          >
                            {orderStatusLabel(s.status)}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-[#718096] transition motion-safe:duration-200 ${
                              open ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-[#526174]">
                        <span>{order.items.length} منتج في الطلب</span>
                        {s.trackingNumber && (
                          <span dir="ltr">تتبع: {s.trackingNumber}</span>
                        )}
                      </div>
                    </button>

                    <div
                      className={`grid transition-[grid-template-rows] motion-safe:duration-300 ${
                        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="space-y-4 border-t border-[#E5EAF1] px-4 pb-4 pt-3">
                          {/* Shipment mini timeline from order events */}
                          <div>
                            <p className="mb-2 text-xs font-semibold text-[#14243A]">
                              تحديثات التتبع
                            </p>
                            {events.length === 0 ? (
                              <p className="rounded-xl bg-white px-3 py-3 text-sm text-[#718096]">
                                لم تبدأ تحديثات التتبع بعد
                              </p>
                            ) : (
                              <ol className="relative space-y-0 border-r-2 border-[#E5EAF1] pr-4">
                                {[...events].reverse().map((ev) => (
                                  <li key={ev.id} className="relative pb-4 last:pb-0">
                                    <span className="absolute -right-[9px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#3157D5]" />
                                    <p className="text-sm font-semibold text-[#14243A]">
                                      {orderStatusLabel(ev.toStatus)}
                                    </p>
                                    <p className="text-[11px] text-[#718096]">
                                      {formatDateTime(ev.createdAt)}
                                    </p>
                                    {ev.note && (
                                      <p className="mt-1 text-xs text-[#526174]">{ev.note}</p>
                                    )}
                                  </li>
                                ))}
                              </ol>
                            )}
                          </div>

                          {(s.carrier || s.trackingNumber) && (
                            <div className="rounded-xl bg-white px-3 py-2 text-sm text-[#526174]">
                              {s.carrier && <p>الناقل: {s.carrier}</p>}
                              {s.trackingNumber && (
                                <p dir="ltr">رقم التتبع: {s.trackingNumber}</p>
                              )}
                            </div>
                          )}

                          <div>
                            <p className="mb-2 text-xs font-semibold text-[#14243A]">
                              منتجات الطلب
                            </p>
                            <ul className="space-y-2">
                              {order.items.map((item, i) => (
                                <li
                                  key={`${item.productId}-${i}`}
                                  className="flex gap-3 rounded-xl bg-white p-2"
                                >
                                  <ProductImage
                                    src={item.image}
                                    onOpen={() => item.image && setLightbox(item.image)}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-[#14243A]">
                                      {item.name}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                      <span className="rounded-md bg-[#EEF3FF] px-1.5 py-0.5 text-[11px] font-bold text-[#3157D5]">
                                        ×{item.quantity}
                                      </span>
                                      <span className="text-xs text-[#718096]">
                                        {formatPrice(item.price)}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-sm font-bold text-[#14243A]">
                                    {formatPrice(item.price * item.quantity)}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Products (full list) */}
          <section className="rounded-2xl border border-[#E5EAF1] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className={iconWrap("navy")}>
                <Package className="h-5 w-5" />
              </span>
              <h2 className="text-base font-bold text-[#14243A]">المنتجات</h2>
            </div>
            <ul className="space-y-3">
              {order.items.map((item, idx) => (
                <li
                  key={`${item.productId}-full-${idx}`}
                  className="flex gap-3 border-b border-[#F0F3F8] pb-3 last:border-0 last:pb-0"
                >
                  <ProductImage
                    src={item.image}
                    onOpen={() => item.image && setLightbox(item.image)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#14243A]">{item.name}</p>
                    {item.variant && (
                      <p className="text-xs text-[#718096]">{item.variant}</p>
                    )}
                    <p className="mt-1 text-xs text-[#718096]">
                      سعر الوحدة: {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="text-left">
                    <span className="rounded-md bg-[#F6F8FB] px-2 py-0.5 text-xs font-bold text-[#14243A]">
                      ×{item.quantity}
                    </span>
                    <p className="mt-1 text-sm font-bold text-[#14243A]">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Journey mobile */}
          <section className="rounded-2xl border border-[#E5EAF1] bg-white p-5 shadow-sm sm:p-6 lg:hidden">
            <JourneyBlock
              order={order}
              events={events}
              step={step}
              cancelled={cancelled}
              lastUpdate={lastUpdate}
              openStage={openStage}
              setOpenStage={setOpenStage}
              eventTimeForStage={eventTimeForStage}
              formatDateTime={formatDateTime}
              eventsCursor={eventsCursor}
              loadingMoreEvents={loadingMoreEvents}
              onLoadMoreEvents={onLoadMoreEvents}
            />
          </section>

          {/* Notes */}
          {order.notes && (
            <section className="rounded-2xl border border-[#E5EAF1] bg-[#F6F8FB] p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#14243A]">ملاحظات الطلب</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#526174]">
                {order.notes}
              </p>
            </section>
          )}
        </div>

        {/* ========== Sidebar / Mobile-first summary ========== */}
        <div className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-4">
          {/* Summary card */}
          <section className="rounded-2xl border border-[#E5EAF1] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#718096]">رقم الطلب</p>
                <p className="mt-1 font-mono text-xl font-bold text-[#14243A]">
                  {order.orderNumber}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-[#718096]">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
                  orderStatusTone(order.status)
                }`}
              >
                {cancelled ? (
                  <XCircle className="h-3.5 w-3.5" />
                ) : order.status === "delivered" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Package className="h-3.5 w-3.5" />
                )}
                {orderStatusLabel(order.status)}
              </span>
            </div>

            <div className="mt-5 rounded-xl bg-[#F6F8FB] px-4 py-3">
              <p className="text-xs text-[#718096]">إجمالي الطلب</p>
              <p className="text-2xl font-bold text-[#3157D5]">
                {formatPrice(order.total)}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void copyText(order.orderNumber, "تم نسخ رقم الطلب")}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E5EAF1] bg-white px-3 py-2.5 text-xs font-semibold text-[#14243A] hover:bg-[#F6F8FB]"
              >
                <Copy className="h-3.5 w-3.5" />
                نسخ الرقم
              </button>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#18A999] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#149486]"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                واتساب
              </a>
              <Link
                href="/account/support"
                className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#3157D5]/30 bg-[#EEF3FF] px-3 py-2.5 text-xs font-semibold text-[#3157D5]"
              >
                صفحة الدعم
              </Link>
            </div>
          </section>

          {/* Amounts */}
          <section className="rounded-2xl border border-[#E5EAF1] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#14243A]">تفاصيل المبلغ</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-[#526174]">
                <span>مجموع المنتجات</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#526174]">
                <span>التوصيل</span>
                <span>{formatPrice(order.shipping)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[#21865B]">
                  <span>خصم</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#E5EAF1] pt-3 text-base font-bold">
                <span className="text-[#14243A]">الإجمالي</span>
                <span className="text-[#3157D5]">{formatPrice(order.total)}</span>
              </div>
              <p className="text-[11px] text-[#718096]">الدفع عند الاستلام</p>
            </div>
          </section>

          {/* Address */}
          <section className="rounded-2xl border border-[#E5EAF1] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <span className={iconWrap("teal")}>
                <MapPin className="h-5 w-5" />
              </span>
              <h2 className="text-sm font-bold text-[#14243A]">عنوان التوصيل</h2>
            </div>
            <p className="text-sm font-semibold text-[#14243A]">{order.customerName}</p>
            <p className="mt-1 text-sm leading-7 text-[#526174]">{fullAddress}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`tel:${order.phone}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#EEF3FF] px-3 py-2 text-xs font-semibold text-[#3157D5]"
              >
                <Phone className="h-3.5 w-3.5" />
                اتصال
              </a>
              <button
                type="button"
                onClick={() => void copyText(order.phone, "تم نسخ رقم الهاتف")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5EAF1] px-3 py-2 text-xs font-semibold text-[#14243A]"
              >
                <Copy className="h-3.5 w-3.5" />
                نسخ الهاتف
              </button>
              <button
                type="button"
                onClick={() => void copyText(fullAddress, "تم نسخ العنوان")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5EAF1] px-3 py-2 text-xs font-semibold text-[#14243A]"
              >
                <Copy className="h-3.5 w-3.5" />
                نسخ العنوان
              </button>
            </div>
            {order.phoneAlt && (
              <p className="mt-2 text-xs text-[#718096]">بديل: {order.phoneAlt}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function JourneyBlock({
  order,
  events,
  step,
  cancelled,
  lastUpdate,
  openStage,
  setOpenStage,
  eventTimeForStage,
  formatDateTime,
  eventsCursor,
  loadingMoreEvents,
  onLoadMoreEvents,
}: {
  order: CustomerOrderDetail;
  events: OrderStatusEvent[];
  step: number;
  cancelled: boolean;
  lastUpdate: string;
  openStage: string | null;
  setOpenStage: (v: string | null) => void;
  eventTimeForStage: (events: OrderStatusEvent[], key: string) => string | null;
  formatDateTime: (iso: string) => string;
  eventsCursor: string | null;
  loadingMoreEvents: boolean;
  onLoadMoreEvents: () => void;
}) {
  return (
    <>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-[#14243A]">رحلة الطلب</h2>
        <p className="text-[11px] text-[#718096]">
          آخر تحديث · {formatDateTime(lastUpdate)}
        </p>
      </div>

      {cancelled ? (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2 text-[#D64C4C]">
            <XCircle className="h-5 w-5" />
            <p className="text-sm font-bold">{orderStatusLabel(order.status)}</p>
          </div>
          <p className="mt-1 text-xs text-[#718096]">
            {formatDateTime(lastUpdate)}
          </p>
        </div>
      ) : (
        <ol className="mt-5 space-y-0">
          {ORDER_TIMELINE.map((t, i) => {
            const done = step > i;
            const current = step === i;
            const open = openStage === t.key;
            const at = eventTimeForStage(events, t.key);
            const isDelivered = t.key === "delivered" && done;

            return (
              <li key={t.key} className="relative flex gap-3 pb-6 last:pb-0">
                {i < ORDER_TIMELINE.length - 1 && (
                  <span
                    className={`absolute right-[15px] top-8 h-[calc(100%-20px)] w-0.5 ${
                      step > i ? "bg-[#3157D5]" : "bg-[#E5EAF1]"
                    }`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setOpenStage(open ? null : t.key)}
                  className={`relative z-[1] grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${
                    current
                      ? "border-[#3157D5] bg-[#3157D5] text-white"
                      : done
                        ? isDelivered
                          ? "border-[#18A999] bg-[#18A999] text-white"
                          : "border-[#3157D5] bg-[#EEF3FF] text-[#3157D5]"
                        : "border-[#E5EAF1] bg-[#F6F8FB] text-[#A0AEC0]"
                  }`}
                  aria-expanded={open}
                >
                  {done || current ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <span className="text-[10px] font-bold">{i + 1}</span>
                  )}
                </button>
                <div className="min-w-0 flex-1 pt-0.5">
                  <button
                    type="button"
                    className="text-right"
                    onClick={() => setOpenStage(open ? null : t.key)}
                  >
                    <p
                      className={`text-sm font-semibold ${
                        current || done ? "text-[#14243A]" : "text-[#A0AEC0]"
                      }`}
                    >
                      {t.label}
                      {current ? " — الحالية" : ""}
                    </p>
                    {at && (
                      <p className="text-[11px] text-[#718096]">{formatDateTime(at)}</p>
                    )}
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] motion-safe:duration-300 ${
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="mt-2 rounded-xl bg-[#F6F8FB] px-3 py-2 text-xs leading-6 text-[#526174]">
                        {current
                          ? "هذه هي الحالة الحالية للطلب وفق النظام."
                          : done
                            ? "تم تأكيد هذه المرحلة من النظام."
                            : "لم تُستكمل هذه المرحلة بعد."}
                        {at ? ` · ${formatDateTime(at)}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {events.length > 0 && (
        <div className="mt-5 border-t border-[#E5EAF1] pt-4">
          <p className="mb-2 text-xs font-semibold text-[#14243A]">سجل التحديثات</p>
          <ul className="space-y-2">
            {events.slice(0, 5).map((ev) => (
              <li key={ev.id} className="text-xs text-[#526174]">
                <span className="font-semibold text-[#14243A]">
                  {orderStatusLabel(ev.toStatus)}
                </span>{" "}
                · {formatDateTime(ev.createdAt)}
              </li>
            ))}
          </ul>
          {eventsCursor && (
            <button
              type="button"
              onClick={onLoadMoreEvents}
              disabled={loadingMoreEvents}
              className="mt-3 text-xs font-bold text-[#3157D5] disabled:opacity-60"
            >
              {loadingMoreEvents ? "جاري التحميل..." : "عرض السجل الكامل"}
            </button>
          )}
        </div>
      )}
    </>
  );
}
