"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { StatCard } from "@/components/admin/cc/StatCard";
import { RefreshCw } from "lucide-react";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function PeriodAnalyticsPage() {
  const [todayOrders, setTodayOrders] = useState(0);
  const [weekOrders, setWeekOrders] = useState(0);
  const [todaySignups, setTodaySignups] = useState(0);
  const [weekSignups, setWeekSignups] = useState(0);
  const [todayVisitors, setTodayVisitors] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const today = startOfDay(new Date()).toISOString();
      const week = new Date();
      week.setDate(week.getDate() - 7);
      const weekIso = week.toISOString();

      const [tOrd, wOrd, tProf, wProf, tVis] = await Promise.all([
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .gte("created_at", today),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .gte("created_at", weekIso),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("account_type", "customer")
          .gte("created_at", today),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("account_type", "customer")
          .gte("created_at", weekIso),
        supabase
          .from("analytics_visitors")
          .select("id", { count: "exact", head: true })
          .gte("last_seen_at", today),
      ]);

      setTodayOrders(tOrd.count || 0);
      setWeekOrders(wOrd.count || 0);
      setTodaySignups(tProf.count || 0);
      setWeekSignups(wProf.count || 0);
      if (!tVis.error) setTodayVisitors(tVis.count || 0);
      else setTodayVisitors(null);
    } catch {
      setError("تعذر تحميل بيانات الفترة");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#14243A]">إحصائيات اليوم والأسبوع</h2>
          <p className="text-sm text-[#718096]">
            طلبات · تسجيلات عملاء · زوار نشطون اليوم
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E4E9F0] bg-white px-3 py-2 text-sm font-semibold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#D64C4C]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="طلبات اليوم"
          value={loading ? "—" : todayOrders}
          tone="teal"
        />
        <StatCard
          label="طلبات آخر 7 أيام"
          value={loading ? "—" : weekOrders}
          tone="blue"
        />
        <StatCard
          label="زوار نشطون اليوم"
          value={loading ? "—" : todayVisitors === null ? "—" : todayVisitors}
          hint={
            todayVisitors === null
              ? "جدول التتبع غير متاح"
              : "حسب last_seen_at في analytics_visitors"
          }
        />
        <StatCard
          label="تسجيلات اليوم"
          value={loading ? "—" : todaySignups}
          tone="success"
          hint="profiles · عملاء"
        />
        <StatCard
          label="تسجيلات آخر 7 أيام"
          value={loading ? "—" : weekSignups}
          tone="blue"
        />
      </div>
    </div>
  );
}
