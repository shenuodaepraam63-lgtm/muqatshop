"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { StatCard } from "@/components/admin/cc/StatCard";
import { Users } from "lucide-react";

export default function CustomersAnalyticsPage() {
  const [total, setTotal] = useState(0);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, is_active")
        .eq("account_type", "customer");
      const list = data || [];
      setTotal(list.length);
      setActive(list.filter((x) => x.is_active !== false).length);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#14243A]">إحصائيات المستخدمين</h2>
        <p className="text-sm text-[#718096]">ملخص حسابات العملاء من قاعدة البيانات</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="إجمالي العملاء"
          value={loading ? "—" : total}
          icon={<Users className="h-4 w-4" />}
          tone="blue"
        />
        <StatCard
          label="نشطون"
          value={loading ? "—" : active}
          tone="success"
        />
        <StatCard
          label="موقوفون"
          value={loading ? "—" : Math.max(0, total - active)}
          tone="warn"
        />
        <StatCard
          label="عملاء جدد (اليوم)"
          value="—"
          hint="يتطلب حقل تاريخ تسجيل دقيق على كل الصفوف"
        />
      </div>
    </div>
  );
}
