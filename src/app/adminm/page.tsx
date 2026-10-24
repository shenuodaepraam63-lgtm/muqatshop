"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { releaseMaturedProfits } from "@/lib/merchant";

export default function AdminmHome() {
  const [stats, setStats] = useState({
    merchants: 0,
    orders: 0,
    pendingWithdraw: 0,
    walletTotal: 0,
  });

  useEffect(() => {
    (async () => {
      await releaseMaturedProfits();
      const [{ count: mc }, { data: ords }, { data: wd }, { data: wallets }] =
        await Promise.all([
          supabase.from("merchants").select("id", { count: "exact", head: true }),
          supabase.from("orders").select("id").not("merchant_id", "is", null),
          supabase.from("merchant_withdrawals").select("id").eq("status", "processing"),
          supabase.from("merchant_wallets").select("balance, pending"),
        ]);
      const walletTotal = (wallets || []).reduce(
        (s, w) => s + Number(w.balance || 0) + Number(w.pending || 0),
        0
      );
      setStats({
        merchants: mc || 0,
        orders: ords?.length || 0,
        pendingWithdraw: wd?.length || 0,
        walletTotal,
      });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">نظرة عامة</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-muted">التجار</p>
          <p className="text-2xl font-bold">{stats.merchants}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-muted">طلبات تجار</p>
          <p className="text-2xl font-bold">{stats.orders}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-muted">سحوبات قيد المعالجة</p>
          <p className="text-2xl font-bold">{stats.pendingWithdraw}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-muted">إجمالي المحافظ</p>
          <p className="text-lg font-bold">{formatPrice(stats.walletTotal)}</p>
        </div>
      </div>
    </div>
  );
}
