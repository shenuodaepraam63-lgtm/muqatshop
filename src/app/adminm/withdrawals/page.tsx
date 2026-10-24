"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";

type Row = {
  id: string;
  amount: number;
  phone: string;
  status: string;
  created_at: string;
  merchant_id: string;
  merchants?: { name: string; email: string } | null;
};

export default function AdminmWithdrawalsPage() {
  const [list, setList] = useState<Row[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("merchant_withdrawals")
      .select("id, amount, phone, status, created_at, merchant_id, merchants(name, email)")
      .order("created_at", { ascending: false });
    setList((data as unknown as Row[]) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const complete = async (row: Row) => {
    if (!confirm("تأكيد إتمام التحويل للتاجر؟")) return;
    await supabase
      .from("merchant_withdrawals")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", row.id);

    await supabase.from("merchant_messages").insert({
      merchant_id: row.merchant_id,
      body: `تم تحويل مبلغ ${row.amount} ج.م بنجاح على الرقم ${row.phone}. شكرًا لك.`,
    });

    await supabase.from("wallet_transactions").insert({
      merchant_id: row.merchant_id,
      type: "withdraw_done",
      amount: 0,
      note: `تم إتمام سحب ${row.amount} ج.م`,
    });

    load();
  };

  const reject = async (row: Row) => {
    if (!confirm("رفض السحب وإرجاع المبلغ للمحفظة؟")) return;
    const { data: w } = await supabase
      .from("merchant_wallets")
      .select("balance")
      .eq("merchant_id", row.merchant_id)
      .maybeSingle();
    if (w) {
      await supabase
        .from("merchant_wallets")
        .update({
          balance: Number(w.balance) + Number(row.amount),
          updated_at: new Date().toISOString(),
        })
        .eq("merchant_id", row.merchant_id);
    }
    await supabase.from("merchant_withdrawals").update({ status: "rejected" }).eq("id", row.id);
    await supabase.from("merchant_messages").insert({
      merchant_id: row.merchant_id,
      body: `تم رفض طلب السحب بمبلغ ${row.amount} ج.م وإرجاع الرصيد لمحفظتك.`,
    });
    await supabase.from("wallet_transactions").insert({
      merchant_id: row.merchant_id,
      type: "withdraw_reject",
      amount: Number(row.amount),
      note: "رفض سحب — إرجاع الرصيد",
    });
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">السحوبات</h1>
      {list.map((w) => (
        <div key={w.id} className="bg-white border rounded-2xl p-4 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-semibold">
                {(w.merchants as { name?: string } | null)?.name || "تاجر"}
              </p>
              <p className="text-xs text-muted">
                {(w.merchants as { email?: string } | null)?.email}
              </p>
              <p className="mt-1">
                {formatPrice(Number(w.amount))} → {w.phone}
              </p>
              <p className="text-xs text-muted">
                {new Date(w.created_at).toLocaleString("ar-EG")}
              </p>
            </div>
            <span className="text-xs h-fit bg-[#f0ebe3] px-2 py-1 rounded-full">{w.status}</span>
          </div>
          {w.status === "processing" && (
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => complete(w)}
                className="text-xs bg-ink text-white px-3 py-1.5 rounded-full"
              >
                تم التحويل
              </button>
              <button
                type="button"
                onClick={() => reject(w)}
                className="text-xs border px-3 py-1.5 rounded-full text-sale"
              >
                رفض
              </button>
            </div>
          )}
        </div>
      ))}
      {list.length === 0 && <p className="text-sm text-muted">لا توجد سحوبات</p>}
    </div>
  );
}
