"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { StatCard } from "@/components/admin/cc/StatCard";
import { RefreshCw, Eye, Users, Clock, MousePointerClick } from "lucide-react";

type Totals = {
  visitors: number;
  new_visitors: number;
  returning_visitors: number;
  sessions: number;
  page_views: number;
  product_views: number;
  active_seconds: number;
  avg_session_seconds: number;
  converted_visitors: number;
  conversion_rate: number;
};

export default function VisitorsAnalyticsPage() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("يلزم تسجيل الدخول كأدمن");
        setTotals(null);
        return;
      }
      const res = await fetch("/api/admin/analytics/visitors", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "تعذر تحميل الإحصائيات");
        setTotals(null);
        return;
      }
      setTotals(json.totals as Totals);
    } catch {
      setError("تعذر الاتصال بالخادم");
      setTotals(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const fmtTime = (sec: number) => {
    if (sec < 60) return `${sec} ث`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m} د ${s} ث`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#14243A]">إحصائيات الزائرين</h2>
          <p className="mt-1 text-sm text-[#718096]">
            بيانات حقيقية من نظام التتبع (آخر 30 يومًا افتراضيًا)
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

      {!error && !totals && loading && (
        <p className="text-sm text-[#718096]">جاري التحميل...</p>
      )}

      {totals && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="الزائرون (الفترة)"
              value={totals.visitors}
              icon={<Users className="h-4 w-4" />}
              tone="blue"
            />
            <StatCard label="جدد" value={totals.new_visitors} tone="teal" />
            <StatCard label="عائدون" value={totals.returning_visitors} />
            <StatCard
              label="الجلسات"
              value={totals.sessions}
              icon={<MousePointerClick className="h-4 w-4" />}
            />
            <StatCard
              label="مشاهدات الصفحات"
              value={totals.page_views}
              icon={<Eye className="h-4 w-4" />}
            />
            <StatCard label="مشاهدات المنتجات" value={totals.product_views} />
            <StatCard
              label="متوسط الجلسة"
              value={fmtTime(totals.avg_session_seconds)}
              icon={<Clock className="h-4 w-4" />}
              tone="success"
            />
            <StatCard
              label="تحويل لحساب"
              value={`${totals.converted_visitors} (${totals.conversion_rate}%)`}
            />
          </div>
          <p className="text-[11px] text-[#94A3B8]">
            إجمالي الوقت النشط في الفترة: {fmtTime(totals.active_seconds)} — القياس تقديري عبر
            Heartbeat.
          </p>
        </>
      )}

      {!loading && totals && totals.visitors === 0 && (
        <div className="rounded-2xl border border-dashed border-[#E4E9F0] bg-white px-6 py-10 text-center text-sm text-[#718096]">
          لا زيارات مسجّلة في الفترة بعد. تصفّح المتجر كزائر ثم حدّث الصفحة.
        </div>
      )}
    </div>
  );
}
