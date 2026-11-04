"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { StatCard } from "@/components/admin/cc/StatCard";
import {
  Package,
  ShoppingBag,
  Users,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
};

type OverviewStats = {
  products: number;
  customers: number;
  orders: number;
  delivered: number;
  newOrders: number;
  confirmed: number;
  shipped: number;
  cancelled: number;
  revenue: number;
  lowStock: number;
};

const emptyStats: OverviewStats = {
  products: 0,
  customers: 0,
  orders: 0,
  delivered: 0,
  newOrders: 0,
  confirmed: 0,
  shipped: 0,
  cancelled: 0,
  revenue: 0,
  lowStock: 0,
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats>(emptyStats);
  const [recent, setRecent] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [prodRes, ordRes, custRes, profileRes] = await Promise.all([
        supabase.from("products").select("id, stock, is_active"),
        supabase
          .from("orders")
          .select("id, order_number, customer_name, total, status, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("account_type", "customer"),
      ]);

      if (prodRes.error && ordRes.error) {
        setError("تعذر تحميل بيانات النظرة العامة");
        setStats(emptyStats);
        setRecent([]);
        return;
      }

      const products = prodRes.data || [];
      const orders = (ordRes.data || []) as OrderRow[];

      const customersCount =
        typeof profileRes.count === "number" && profileRes.count > 0
          ? profileRes.count
          : typeof custRes.count === "number"
            ? custRes.count
            : 0;

      const byStatus = (s: string) => orders.filter((o) => o.status === s).length;

      setStats({
        products: products.length,
        customers: customersCount,
        orders: orders.length,
        delivered: byStatus("delivered"),
        newOrders: byStatus("new"),
        confirmed: byStatus("confirmed"),
        shipped: byStatus("shipped"),
        cancelled: byStatus("cancelled"),
        revenue: orders
          .filter((o) => o.status !== "cancelled")
          .reduce((s, o) => s + Number(o.total || 0), 0),
        lowStock: products.filter(
          (p) => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= 3
        ).length,
      });
      setRecent(orders.slice(0, 8));
      setUpdatedAt(new Date());
    } catch {
      setError("تعذر تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const statusLabel = (s: string) =>
    (
      {
        new: "جديد",
        confirmed: "مؤكد",
        shipped: "شحن",
        delivered: "تسليم",
        cancelled: "ملغي",
      } as Record<string, string>
    )[s] || s;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#14243A]">نظرة عامة</h2>
          <p className="mt-1 text-sm text-[#718096]">
            تابع أداء Muqatshop ونشاط المتجر من مكان واحد.
          </p>
          <p className="mt-1 text-[11px] text-[#94A3B8]">
            {new Date().toLocaleDateString("ar-EG", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {updatedAt
              ? ` · آخر تحديث ${updatedAt.toLocaleTimeString("ar-EG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E4E9F0] bg-white px-3 py-2 text-sm font-semibold text-[#14243A] hover:bg-[#F6F8FB]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
          <Link
            href="/admin/orders"
            className="rounded-xl bg-[#3157D5] px-3 py-2 text-sm font-semibold text-white"
          >
            الطلبات
          </Link>
          <Link
            href="/admin/products"
            className="rounded-xl border border-[#E4E9F0] bg-white px-3 py-2 text-sm font-semibold text-[#14243A]"
          >
            المنتجات
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#D64C4C]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="المنتجات"
          value={loading ? "—" : stats.products}
          hint="إجمالي المنتجات في الكتالوج"
          icon={<Package className="h-4 w-4" />}
          tone="default"
        />
        <StatCard
          label="العملاء"
          value={loading ? "—" : stats.customers}
          hint="حسابات العملاء المسجلة"
          icon={<Users className="h-4 w-4" />}
          tone="blue"
        />
        <StatCard
          label="إجمالي الطلبات"
          value={loading ? "—" : stats.orders}
          hint={`${stats.newOrders} بانتظار التأكيد`}
          icon={<ShoppingBag className="h-4 w-4" />}
          tone="teal"
        />
        <StatCard
          label="تم التسليم"
          value={loading ? "—" : stats.delivered}
          hint={`مبيعات (غير الملغاة): ${formatPrice(stats.revenue)}`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="success"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { k: "جديد", v: stats.newOrders },
          { k: "مؤكد", v: stats.confirmed },
          { k: "شحن", v: stats.shipped },
          { k: "تسليم", v: stats.delivered },
          { k: "ملغي", v: stats.cancelled },
        ].map((x) => (
          <div
            key={x.k}
            className="rounded-2xl border border-[#E4E9F0] bg-white px-4 py-3 text-center"
          >
            <p className="text-xs text-[#718096]">{x.k}</p>
            <p className="mt-1 text-xl font-bold text-[#14243A]">
              {loading ? "—" : x.v}
            </p>
          </div>
        ))}
      </div>

      {stats.lowStock > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {stats.lowStock} منتج بمخزون منخفض (≤ 3)
            </p>
            <Link href="/admin/products" className="text-xs font-bold text-[#3157D5]">
              مراجعة المنتجات
            </Link>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#E4E9F0] bg-white">
        <div className="flex items-center justify-between border-b border-[#E4E9F0] px-4 py-3">
          <h3 className="text-sm font-bold text-[#14243A]">آخر الطلبات</h3>
          <Link href="/admin/orders" className="text-xs font-bold text-[#3157D5]">
            عرض الكل
          </Link>
        </div>
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-[#718096]">جاري التحميل...</p>
        ) : recent.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#718096]">لا توجد طلبات بعد</p>
        ) : (
          <ul className="divide-y divide-[#E4E9F0]">
            {recent.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#F6F8FB]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#202B3C]">
                      {o.customer_name}
                    </p>
                    <p className="text-[11px] text-[#718096]">
                      {o.order_number} ·{" "}
                      {new Date(o.created_at).toLocaleString("ar-EG", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="shrink-0 text-left">
                    <p className="text-sm font-bold">{formatPrice(Number(o.total))}</p>
                    <p className="text-[11px] text-[#718096]">{statusLabel(o.status)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[11px] text-[#94A3B8]">
        ملاحظة: إحصائيات الزائرين غير متاحة بعد — لا يوجد نظام تتبع زيارات في المشروع حاليًا.
        الأرقام أعلاه من الطلبات والمنتجات والعملاء فقط.
      </p>
    </div>
  );
}
