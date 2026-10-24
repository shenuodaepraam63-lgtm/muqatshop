"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  getMerchantSession,
  getMerchantSettings,
  releaseMaturedProfits,
} from "@/lib/merchant";
import { formatPrice } from "@/lib/utils";

export default function MerchantWalletPage() {
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState(0);
  const [minW, setMinW] = useState(200);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [txs, setTxs] = useState<{ type: string; amount: number; note: string | null; created_at: string }[]>([]);
  const [withdrawals, setWithdrawals] = useState<
    { amount: number; status: string; phone: string; created_at: string }[]
  >([]);

  const load = async () => {
    const s = getMerchantSession();
    if (!s) return;
    await releaseMaturedProfits(s.id);
    const settings = await getMerchantSettings();
    setMinW(settings.min_withdrawal);
    const [{ data: w }, { data: t }, { data: wd }] = await Promise.all([
      supabase.from("merchant_wallets").select("balance, pending").eq("merchant_id", s.id).maybeSingle(),
      supabase
        .from("wallet_transactions")
        .select("type, amount, note, created_at")
        .eq("merchant_id", s.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("merchant_withdrawals")
        .select("amount, status, phone, created_at")
        .eq("merchant_id", s.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    if (w) {
      setBalance(Number(w.balance) || 0);
      setPending(Number(w.pending) || 0);
    }
    setTxs(t || []);
    setWithdrawals(wd || []);
    if (s.phone) setPhone(s.phone);
  };

  useEffect(() => {
    load();
  }, []);

  const requestWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const s = getMerchantSession();
    if (!s) return;
    const a = Number(amount);
    if (!a || a < minW) {
      setMsg(`الحد الأدنى للسحب ${minW} ج.م`);
      return;
    }
    if (a > balance) {
      setMsg("الرصيد غير كافٍ");
      return;
    }
    if (!phone.trim()) {
      setMsg("أدخل رقم التحويل");
      return;
    }

    const { error } = await supabase.from("merchant_withdrawals").insert({
      merchant_id: s.id,
      amount: a,
      phone: phone.trim(),
      status: "processing",
    });
    if (error) {
      setMsg(error.message);
      return;
    }

    await supabase
      .from("merchant_wallets")
      .update({ balance: balance - a, updated_at: new Date().toISOString() })
      .eq("merchant_id", s.id);

    await supabase.from("wallet_transactions").insert({
      merchant_id: s.id,
      type: "withdraw_hold",
      amount: -a,
      note: "طلب سحب — قيد المعالجة",
    });

    await supabase.from("merchant_messages").insert({
      merchant_id: s.id,
      body: `تم استلام طلب سحب بمبلغ ${a} ج.م على الرقم ${phone.trim()} — الحالة: قيد المعالجة`,
    });

    setAmount("");
    setMsg("تم إرسال طلب السحب");
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">المحفظة</h1>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-xs text-muted">متاح للسحب</p>
          <p className="text-xl font-bold">{formatPrice(balance)}</p>
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-xs text-muted">معلّق</p>
          <p className="text-xl font-bold">{formatPrice(pending)}</p>
        </div>
      </div>

      <form onSubmit={requestWithdraw} className="bg-white border rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-sm">طلب سحب</h2>
        <p className="text-xs text-muted">الحد الأدنى {formatPrice(minW)}</p>
        <input
          type="number"
          min={minW}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="المبلغ"
          className="w-full border rounded-xl px-3 py-2.5 text-sm"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="رقم فودافون كاش / إنستا باي"
          className="w-full border rounded-xl px-3 py-2.5 text-sm"
        />
        {msg && <p className="text-sm text-muted">{msg}</p>}
        <button type="submit" className="w-full bg-ink text-white py-2.5 rounded-full text-sm font-semibold">
          إرسال الطلب
        </button>
      </form>

      {withdrawals.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm">سحوباتي</h2>
          {withdrawals.map((w, i) => (
            <div key={i} className="bg-white border rounded-xl px-3 py-2 text-sm flex justify-between">
              <span>{formatPrice(Number(w.amount))}</span>
              <span className="text-muted text-xs">{w.status}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="font-semibold text-sm">سجل المحفظة</h2>
        {txs.map((t, i) => (
          <div key={i} className="text-xs bg-white border rounded-xl px-3 py-2">
            <div className="flex justify-between">
              <span>{t.type}</span>
              <span className={Number(t.amount) >= 0 ? "text-green-700" : "text-sale"}>
                {formatPrice(Number(t.amount))}
              </span>
            </div>
            {t.note && <p className="text-muted mt-0.5">{t.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
