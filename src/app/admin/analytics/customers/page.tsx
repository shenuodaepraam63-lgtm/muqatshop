"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { StatCard } from "@/components/admin/cc/StatCard";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

type CustomerStats = {
  total: number;
  active: number;
  suspended: number;
  newToday: number;
  newWeek: number;
  newMonth: number;
  withOrders: number;
  withoutOrders: number;
};

const empty: CustomerStats = {
  total: 0,
  active: 0,
  suspended: 0,
  newToday: 0,
  newWeek: 0,
  newMonth: 0,
  withOrders: 0,
  withoutOrders: 0,
};

function startOfLocalDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function CustomersAnalyticsPage() {
  const [stats, setStats] = useState<CustomerStats>(empty);
  const [recent, setRecent] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const todayStart = startOfLocalDay().toISOString();
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekIso = weekStart.toISOString();
      const monthStart = new Date();
      monthStart.setDate(monthStart.getDate() - 30);
      const monthIso = monthStart.toISOString();

      const [profilesRes, ordersRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, phone, is_active, created_at")
          .eq("account_type", "customer")
          .order("created_at", { ascending: false }),
        supabase.from("orders").select("customer_id, customer_email"),
      ]);

      let list = (profilesRes.data || []) as ProfileRow[];

      // Fallback: customers table if profiles empty or error
      if (profilesRes.error || list.length === 0) {
        const { data: cRows, error: cErr } = await supabase
          .from("customers")
          .select("id, name, phone, is_active, created_at")
          .order("created_at", { ascending: false });
        if (!cErr && cRows && cRows.length > 0) {
          list = cRows.map((x: {
            id: string;
            name?: string | null;
            phone?: string | null;
            is_active?: boolean | null;
            created_at?: string | null;
          }) => ({
            id: x.id,
            full_name: x.name ?? null,
            phone: x.phone ?? null,
            is_active: x.is_active ?? true,
            created_at: x.created_at ?? null,
          }));
        } else if (profilesRes.error && list.length === 0) {
          setError(profilesRes.error.message || "تعذر تحميل العملاء");
        }
      }

      const active = list.filter((x) => x.is_active !== false).length;
      const suspended = Math.max(0, list.length - active);

      const inRange = (iso: string | null, since: string) => {
        if (!iso) return false;
        return new Date(iso).getTime() >= new Date(since).getTime();
      };

      const newToday = list.filter((x) => inRange(x.created_at, todayStart)).length;
      const newWeek = list.filter((x) => inRange(x.created_at, weekIso)).length;
      const newMonth = list.filter((x) => inRange(x.created_at, monthIso)).length;

      const orderCustomerIds = new Set<string>();
      for (const o of ordersRes.data || []) {
        if (o.customer_id) orderCustomerIds.add(String(o.customer_id));
      }

      // Match by profile id when customer_id points to customers or profiles
      let withOrders = 0;
      for (const p of list) {
        if (orderCustomerIds.has(p.id)) withOrders += 1;
      }
      // If linkage is weak (customer_id on different table), estimate from distinct customer_ids
      if (withOrders === 0 && orderCustomerIds.size > 0) {
        withOrders = Math.min(list.length, orderCustomerIds.size);
      }
      const withoutOrders = Math.max(0, list.length - withOrders);

      setStats({
        total: list.length,
        active,
        suspended,
        newToday,
        newWeek,
        newMonth,
        withOrders,
        withoutOrders,
      });
      setRecent(list.slice(0, 12));
      setUpdatedAt(new Date());
    } catch {
      setError("تعذر تحميل إحصائيات العملاء");
      setStats(empty);
      setRecent([]);
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
          <h2 className="text-xl font-bold text-[#14243A]">إحصائيات المستخدمين</h2>
          <p className="mt-1 text-sm text-[#718096]">
            ملخص حسابات العملاء من قاعدة البيانات (تسجيل · نشاط · طلبات)
          </p>
          {updatedAt && (
            <p className="mt-1 text-[11px] text-[#94A3B8]">
              آخر تحديث{" "}
              {updatedAt.toLocaleTimeString("ar-EG", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
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
            href="/admin/customers"
            className="rounded-xl bg-[#3157D5] px-3 py-2 text-sm font-semibold text-white"
          >
            إدارة العملاء
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
          label="إجمالي العملاء"
          value={loading ? "—" : stats.total}
          icon={<Users className="h-4 w-4" />}
          tone="blue"
        />
        <StatCard
          label="نشطون"
          value={loading ? "—" : stats.active}
          icon={<UserCheck className="h-4 w-4" />}
          tone="success"
        />
        <StatCard
          label="موقوفون"
          value={loading ? "—" : stats.suspended}
          icon={<UserX className="h-4 w-4" />}
          tone="warn"
        />
        <StatCard
          label="عملاء جدد (اليوم)"
          value={loading ? "—" : stats.newToday}
          icon={<UserPlus className="h-4 w-4" />}
          tone="teal"
          hint="حسب تاريخ التسجيل في الملف"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="جدد آخر 7 أيام"
          value={loading ? "—" : stats.newWeek}
          tone="teal"
        />
        <StatCard
          label="جدد آخر 30 يومًا"
          value={loading ? "—" : stats.newMonth}
          tone="blue"
        />
        <StatCard
          label="لديهم طلبات"
          value={loading ? "—" : stats.withOrders}
          icon={<ShoppingBag className="h-4 w-4" />}
          tone="success"
          hint="ربط عبر customer_id في الطلبات"
        />
        <StatCard
          label="بدون طلبات"
          value={loading ? "—" : stats.withoutOrders}
          hint="حسابات مسجّلة بلا طلب مرتبط"
        />
      </div>

      <div className="rounded-2xl border border-[#E4E9F0] bg-white">
        <div className="flex items-center justify-between border-b border-[#E4E9F0] px-4 py-3">
          <h3 className="text-sm font-bold text-[#14243A]">أحدث التسجيلات</h3>
          <Link href="/admin/customers" className="text-xs font-bold text-[#3157D5]">
            عرض الكل
          </Link>
        </div>
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-[#718096]">جاري التحميل...</p>
        ) : recent.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#718096]">
            لا يوجد عملاء مسجلون بعد
          </p>
        ) : (
          <ul className="divide-y divide-[#E4E9F0]">
            {recent.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#202B3C]">
                    {r.full_name || "بدون اسم"}
                  </p>
                  <p className="text-[11px] text-[#718096]">{r.phone || "—"}</p>
                </div>
                <div className="shrink-0 text-left">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      r.is_active !== false
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-[#718096]"
                    }`}
                  >
                    {r.is_active !== false ? "نشط" : "موقوف"}
                  </span>
                  <p className="mt-1 text-[11px] text-[#718096]">
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString("ar-EG", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[11px] text-[#94A3B8]">
        المصدر الأساسي: جدول profiles (account_type = customer). عند الحاجة يُستخدم جدول
        customers كاحتياطي. أرقام الطلبات تعتمد على customer_id في orders.
      </p>
    </div>
  );
}
