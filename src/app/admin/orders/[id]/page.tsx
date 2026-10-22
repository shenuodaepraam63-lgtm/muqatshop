"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase, type Order } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";

const statusOptions = [
  { value: "new", label: "جديد" },
  { value: "confirmed", label: "مؤكد" },
  { value: "shipped", label: "تم الشحن" },
  { value: "delivered", label: "تم التسليم" },
  { value: "cancelled", label: "ملغي" },
];

export default function AdminOrderInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setOrder(data as Order | null);
        setLoading(false);
      });
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!order) return;
    setSaving(true);
    const { data } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", order.id)
      .select()
      .single();
    if (data) setOrder(data as Order);
    setSaving(false);
  };

  if (loading) {
    return <p className="text-muted text-sm">جاري التحميل...</p>;
  }

  if (!order) {
    return (
      <div>
        <p className="text-muted mb-4">الطلب غير موجود</p>
        <button type="button" onClick={() => router.back()} className="text-sm underline">
          رجوع
        </button>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="max-w-2xl">
      <Link href="/admin/orders" className="text-sm text-muted hover:text-ink mb-4 inline-block">
        ← كل الطلبات
      </Link>

      {/* Invoice card */}
      <div className="bg-white border border-[#e8e2d9] rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-ink text-page px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs opacity-70">فاتورة طلب</p>
            <p className="text-lg font-bold font-mono">{order.order_number}</p>
          </div>
          <div className="text-left text-sm">
            {new Date(order.created_at).toLocaleString("ar-EG", {
              dateStyle: "full",
              timeStyle: "short",
            })}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer */}
          <section>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-muted mb-3">
              بيانات العميل
            </h2>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <p>
                <span className="text-muted">الاسم: </span>
                <strong>{order.customer_name}</strong>
              </p>
              <p>
                <span className="text-muted">الهاتف: </span>
                <a href={`tel:${order.phone}`} className="font-medium underline">
                  {order.phone}
                </a>
              </p>
              {order.phone_alt && (
                <p>
                  <span className="text-muted">احتياطي: </span>
                  <a href={`tel:${order.phone_alt}`}>{order.phone_alt}</a>
                </p>
              )}
            </div>
          </section>

          {/* Address */}
          <section>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-muted mb-3">
              عنوان التوصيل
            </h2>
            <p className="text-sm leading-relaxed">
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
              <p className="text-sm mt-2 bg-[#f8f5f0] rounded-lg px-3 py-2">
                <span className="text-muted">ملاحظات: </span>
                {order.notes}
              </p>
            )}
          </section>

          {/* Items */}
          <section>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-muted mb-3">
              المنتجات
            </h2>
            <ul className="divide-y divide-[#e8e2d9] border border-[#e8e2d9] rounded-xl overflow-hidden">
              {items.map((item, i) => (
                <li key={i} className="flex gap-3 p-3 items-center">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#f0ebe3] shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt="" fill className="object-cover" sizes="56px" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                    <p className="text-xs text-muted">
                      {item.quantity} × {formatPrice(Number(item.price))}
                    </p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">
                    {formatPrice(Number(item.price) * Number(item.quantity))}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Totals */}
          <section className="border-t border-[#e8e2d9] pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">المجموع الفرعي</span>
              <span>{formatPrice(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">التوصيل</span>
              <span>{formatPrice(Number(order.shipping))}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2">
              <span>الإجمالي</span>
              <span>{formatPrice(Number(order.total))}</span>
            </div>
          </section>

          {/* Status */}
          <section>
            <label className="block text-xs font-semibold tracking-widest uppercase text-muted mb-2">
              حالة الطلب
            </label>
            <select
              value={order.status}
              disabled={saving}
              onChange={(e) => updateStatus(e.target.value)}
              className="w-full sm:w-auto rounded-xl border border-[#e8e2d9] px-4 py-2.5 text-sm bg-white"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </section>
        </div>
      </div>
    </div>
  );
}
