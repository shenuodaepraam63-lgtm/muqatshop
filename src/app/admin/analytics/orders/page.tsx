"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { StatCard } from "@/components/admin/cc/StatCard";
import { ShoppingBag } from "lucide-react";

export default function OrdersAnalyticsPage() {
  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    cancelled: 0,
    pending: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("orders").select("status, total");
      const rows = data || [];
      const delivered = rows.filter((r) => r.status === "delivered").length;
      const cancelled = rows.filter((r) => r.status === "cancelled").length;
      const pending = rows.filter((r) =>
        ["new", "confirmed", "shipped"].includes(String(r.status))
      ).length;
      setStats({
        total: rows.length,
        delivered,
        cancelled,
        pending,
        revenue: rows
          .filter((r) => r.status !== "cancelled")
          .reduce((s, r) => s + Number(r.total || 0), 0),
      });
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#14243A]">إحصائيات الطلبات</h2>
        <p className="text-sm text-[#718096]">حسب حالات الطلب المعتمدة في النظام</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="إجمالي الطلبات"
          value={loading ? "—" : stats.total}
          icon={<ShoppingBag className="h-4 w-4" />}
        />
        <StatCard label="ناجحة (تسليم)" value={loading ? "—" : stats.delivered} tone="success" />
        <StatCard label="ملغاة" value={loading ? "—" : stats.cancelled} tone="warn" />
        <StatCard label="قيد المسار" value={loading ? "—" : stats.pending} tone="teal" />
        <StatCard
          label="قيمة غير الملغاة"
          value={loading ? "—" : formatPrice(stats.revenue)}
          tone="blue"
        />
      </div>
    </div>
  );
}
