"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  balance?: number;
  pending?: number;
  orderCount?: number;
  okCount?: number;
  failCount?: number;
};

export default function AdminmMerchantsPage() {
  const [list, setList] = useState<Row[]>([]);

  const load = async () => {
    const { data: merchants } = await supabase
      .from("merchants")
      .select("*")
      .order("created_at", { ascending: false });
    if (!merchants) return;

    const rows: Row[] = [];
    for (const m of merchants) {
      const [{ data: w }, { data: ords }] = await Promise.all([
        supabase.from("merchant_wallets").select("balance, pending").eq("merchant_id", m.id).maybeSingle(),
        supabase.from("orders").select("status").eq("merchant_id", m.id),
      ]);
      rows.push({
        ...m,
        balance: Number(w?.balance) || 0,
        pending: Number(w?.pending) || 0,
        orderCount: ords?.length || 0,
        okCount: ords?.filter((o) => o.status === "delivered").length || 0,
        failCount: ords?.filter((o) => o.status === "cancelled").length || 0,
      });
    }
    setList(rows);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (id: string, is_active: boolean) => {
    await supabase.from("merchants").update({ is_active: !is_active }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">التجار ({list.length})</h1>
      <div className="space-y-3">
        {list.map((m) => (
          <div key={m.id} className="bg-white border rounded-2xl p-4 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-semibold">{m.name}</p>
                <p className="text-xs text-muted">{m.email}</p>
                <p className="text-xs text-muted">{m.phone || "—"}</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(m.id, m.is_active)}
                className={`text-xs px-2 py-1 rounded-full h-fit ${
                  m.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-muted"
                }`}
              >
                {m.is_active ? "نشط" : "موقوف"}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
              <div>طلبات: {m.orderCount}</div>
              <div>ناجح: {m.okCount}</div>
              <div>فاشل: {m.failCount}</div>
              <div>
                محفظة: {formatPrice(m.balance || 0)} / معلّق {formatPrice(m.pending || 0)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
