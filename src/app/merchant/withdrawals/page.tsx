"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  getMerchantSession,
  getMerchantSettings,
  releaseMaturedProfits,
} from "@/lib/merchant";
import { formatPrice } from "@/lib/utils";

export default function MarketerWithdrawalsPage() {
  const [balance, setBalance] = useState(0);
  const [minW, setMinW] = useState(200);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("vodafone_cash");
  const [msg, setMsg] = useState("");
  const [list, setList] = useState<
    { amount: number; status: string; phone: string; created_at: string }[]
  >([]);

  const load = async () => {
    const s = getMerchantSession();
    if (!s) return;
    await releaseMaturedProfits(s.id);
    const settings = await getMerchantSettings();
    setMinW(settings.min_withdrawal);
    const [{ data: w }, { data: wd }] = await Promise.all([
      supabase
        .from("merchant_wallets")
        .select("balance")
        .eq("merchant_id", s.id)
        .maybeSingle(),
      supabase
        .from("merchant_withdrawals")
        .select("amount, status, phone, created_at")
        .eq("merchant_id", s.id)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    if (w) setBalance(Number(w.balance) || 0);
    setList(wd || []);
    if (s.phone) setPhone(s.phone);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const s = getMerchantSession();
    if (!s) return;
    const a = Number(amount);
    if (!a || a < minW) {
      setMsg(`الحد الأدنى للسحب ${formatPrice(minW)}`);
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
      phone: `${method}:${phone.trim()}`,
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
      note: `طلب سحب (${method}) — قيد المعالجة`,
    });

    setAmount("");
    setMsg("تم إرسال طلب السحب — هيتم المراجعة قريب");
    load();
  };

  const statusAr = (s: string) =>
    ({ processing: "قيد المعالجة", paid: "تم التحويل", rejected: "مرفوض" }[s] ||
    s);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">طلبات السحب</h1>
        <p className="text-sm text-muted mt-1">
          فودافون كاش · إنستاباي — الحد الأدنى {formatPrice(minW)}
        </p>
      </div>

      <div className="bg-white border border-[#eae6df] rounded-2xl p-4">
        <p className="text-xs text-muted">الرصيد المتاح للسحب</p>
        <p className="text-2xl font-bold text-green-700 mt-1">{formatPrice(balance)}</p>
        <Link href="/merchant/wallet" className="text-xs text-[#0042EB] hover:underline mt-2 inline-block">
          تفاصيل الأرباح والمستحقات
        </Link>
      </div>

      <form
        onSubmit={submit}
        className="bg-white border border-[#eae6df] rounded-2xl p-4 space-y-3"
      >
        <h2 className="font-semibold text-sm">طلب سحب جديد</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMethod("vodafone_cash")}
            className={`text-sm py-2.5 rounded-xl border ${
              method === "vodafone_cash"
                ? "border-ink bg-ink text-white"
                : "border-[#eae6df]"
            }`}
          >
            فودافون كاش
          </button>
          <button
            type="button"
            onClick={() => setMethod("instapay")}
            className={`text-sm py-2.5 rounded-xl border ${
              method === "instapay"
                ? "border-ink bg-ink text-white"
                : "border-[#eae6df]"
            }`}
          >
            إنستاباي
          </button>
        </div>
        <input
          type="number"
          min={minW}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="المبلغ بالجنيه"
          className="w-full border rounded-xl px-3 py-2.5 text-sm"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="رقم المحفظة / الحساب"
          className="w-full border rounded-xl px-3 py-2.5 text-sm"
          dir="ltr"
        />
        {msg && <p className="text-sm text-muted">{msg}</p>}
        <button
          type="submit"
          className="w-full bg-ink text-white py-3 rounded-full text-sm font-semibold"
        >
          إرسال طلب السحب
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="font-semibold text-sm">سجل الطلبات</h2>
        {list.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">لا طلبات سحب بعد</p>
        ) : (
          list.map((w, i) => (
            <div
              key={i}
              className="bg-white border border-[#eae6df] rounded-xl px-4 py-3 text-sm flex justify-between gap-3"
            >
              <div>
                <p className="font-medium">{formatPrice(Number(w.amount))}</p>
                <p className="text-[11px] text-muted dir-ltr">{w.phone}</p>
              </div>
              <span className="text-xs text-muted shrink-0">{statusAr(w.status)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
