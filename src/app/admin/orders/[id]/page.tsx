"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase, type Order } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import type { OrderShipment } from "@/lib/order-foundation";

const statusOptions = [
  { value: "new", label: "جديد" },
  { value: "confirmed", label: "مؤكد" },
  { value: "processing", label: "قيد التجهيز" },
  { value: "shipped", label: "تم الشحن" },
  { value: "delivered", label: "تم التسليم" },
  { value: "cancelled", label: "ملغي" },
];

type OrderWithVersion = Order & { version?: number };

export default function AdminOrderInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [order, setOrder] = useState<OrderWithVersion | null>(null);
  const [shipments, setShipments] = useState<OrderShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shipSaving, setShipSaving] = useState(false);

  const loadShipments = async (orderId: string) => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/orders/${orderId}/shipments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => null);
    if (body?.ok) setShipments(body.shipments || []);
  };

  useEffect(() => {
    if (!id) return;
    supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setOrder(data as OrderWithVersion | null);
        setLoading(false);
        if (data?.id) void loadShipments(data.id as string);
      });
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!order) return;
    setSaving(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        alert("جلسة منتهية — سجّل الدخول مجددًا");
        return;
      }

      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, expectedVersion: order.version }),
      });
      const body = await res.json().catch(() => null);

      if (res.ok && body?.ok) {
        setOrder({
          ...order,
          status: body.status || status,
          updated_at: body.updatedAt || new Date().toISOString(),
          version: body.version ?? order.version,
        });
        void loadShipments(order.id);
        return;
      }

      if (body?.code === "VERSION_CONFLICT") {
        alert(body.error || "تم تحديث الطلب من جهة أخرى");
        const { data } = await supabase
          .from("orders")
          .select("*")
          .eq("id", order.id)
          .maybeSingle();
        if (data) setOrder(data as OrderWithVersion);
        return;
      }

      // No browser-client fallback write — status changes must pass requireAdmin API.
      alert(body?.error || "تعذر تحديث الحالة عبر الخادم");
    } finally {
      setSaving(false);
    }
  };

  const saveShipment = async (
    shipmentId: string,
    patch: { carrier?: string; trackingNumber?: string; label?: string }
  ) => {
    if (!order) return;
    setShipSaving(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return;
      await fetch(`/api/orders/${order.id}/shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shipmentId, ...patch }),
      });
      await loadShipments(order.id);
    } finally {
      setShipSaving(false);
    }
  };

  const addShipment = async () => {
    if (!order) return;
    setShipSaving(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return;
      await fetch(`/api/orders/${order.id}/shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ create: true, status: order.status }),
      });
      await loadShipments(order.id);
    } finally {
      setShipSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted">جاري التحميل...</p>;
  if (!order) {
    return (
      <div>
        <p className="mb-4 text-muted">الطلب غير موجود</p>
        <button type="button" onClick={() => router.back()} className="text-sm underline">
          رجوع
        </button>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="max-w-2xl">
      <Link href="/admin/orders" className="mb-4 inline-block text-sm text-muted hover:text-ink">
        ← كل الطلبات
      </Link>

      <div className="overflow-hidden rounded-2xl border border-[#e8e2d9] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-ink px-6 py-5 text-page">
          <div>
            <p className="text-xs opacity-70">فاتورة طلب</p>
            <p className="font-mono text-lg font-bold">{order.order_number}</p>
          </div>
          <div className="text-left text-sm">
            {new Date(order.created_at).toLocaleString("ar-EG")}
          </div>
        </div>

        <div className="space-y-6 p-6">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
              العميل
            </h3>
            <p className="text-sm font-medium">{order.customer_name}</p>
            <p className="text-sm text-muted">{order.phone}</p>
            <p className="text-sm text-muted">
              {order.governorate} — {order.center}
              {order.area ? ` — ${order.area}` : ""}
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
              المنتجات
            </h3>
            <ul className="divide-y divide-[#e8e2d9] overflow-hidden rounded-xl border border-[#e8e2d9]">
              {items.map((item, i) => (
                <li key={i} className="flex items-center gap-3 p-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#f0ebe3]">
                    {item.image ? (
                      <Image src={item.image} alt="" fill className="object-cover" sizes="56px" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted">
                      {item.quantity} × {formatPrice(Number(item.price))}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">
                    {formatPrice(Number(item.price) * Number(item.quantity))}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2 border-t border-[#e8e2d9] pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">المجموع الفرعي</span>
              <span>{formatPrice(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">التوصيل</span>
              <span>{formatPrice(Number(order.shipping))}</span>
            </div>
            <div className="flex justify-between pt-2 text-base font-bold">
              <span>الإجمالي</span>
              <span>{formatPrice(Number(order.total))}</span>
            </div>
          </section>

          <section>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted">
              حالة الطلب
            </label>
            <select
              value={order.status}
              disabled={saving}
              onChange={(e) => updateStatus(e.target.value)}
              className="w-full rounded-xl border border-[#e8e2d9] bg-white px-4 py-2.5 text-sm sm:w-auto"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-[11px] text-muted">
              يُسجَّل عبر API محمي فقط · version{" "}
              {order.version != null ? order.version : "—"}
            </p>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
                الشحنات
              </h3>
              <button
                type="button"
                disabled={shipSaving}
                onClick={() => void addShipment()}
                className="text-xs font-semibold text-[#3157D5]"
              >
                + شحنة إضافية
              </button>
            </div>
            <ul className="space-y-3">
              {shipments.map((s) => (
                <li
                  key={s.id}
                  className="space-y-2 rounded-xl border border-[#e8e2d9] p-3"
                >
                  <p className="text-sm font-semibold">{s.label}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-[#e8e2d9] px-3 py-2 text-sm"
                      placeholder="شركة الشحن"
                      defaultValue={s.carrier || ""}
                      onBlur={(e) =>
                        void saveShipment(s.id, { carrier: e.target.value })
                      }
                    />
                    <input
                      className="rounded-lg border border-[#e8e2d9] px-3 py-2 text-sm"
                      placeholder="رقم التتبع"
                      defaultValue={s.trackingNumber || ""}
                      onBlur={(e) =>
                        void saveShipment(s.id, {
                          trackingNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <p className="text-[11px] text-muted">الحالة: {s.status}</p>
                </li>
              ))}
              {shipments.length === 0 && (
                <p className="text-sm text-muted">لا توجد شحنات بعد</p>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
