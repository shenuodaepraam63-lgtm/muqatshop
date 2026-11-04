"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { StatCard } from "@/components/admin/cc/StatCard";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function PeriodAnalyticsPage() {
  const [todayOrders, setTodayOrders] = useState(0);
  const [weekOrders, setWeekOrders] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = startOfDay(new Date()).toISOString();
      const week = new Date();
      week.setDate(week.getDate() - 7);
      const weekIso = week.toISOString();

      const [t, w] = await Promise.all([
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .gte("created_at", today),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .gte("created_at", weekIso),
      ]);

      setTodayOrders(t.count || 0);
      setWeekOrders(w.count || 0);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#14243A]">إحصائيات اليوم والأسبوع</h2>
        <p className="text-sm text-[#718096]">مقارنة قصيرة المدى من بيانات الطلبات فقط</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="طلبات اليوم" value={loading ? "—" : todayOrders} tone="teal" />
        <StatCard label="طلبات آخر 7 أيام" value={loading ? "—" : weekOrders} tone="blue" />
        <StatCard
          label="زوار اليوم"
          value="—"
          hint="غير متاح — لا يوجد تتبع زيارات"
        />
        <StatCard
          label="تسجيلات اليوم"
          value="—"
          hint="يُستكمل عند توحيد مصدر تاريخ التسجيل"
        />
      </div>
    </div>
  );
}
