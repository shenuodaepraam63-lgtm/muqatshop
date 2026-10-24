"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getMerchantSession, releaseMaturedProfits } from "@/lib/merchant";
import { formatPrice } from "@/lib/utils";

export default function MerchantHome() {
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState(0);
  const [orders, setOrders] = useState(0);
  const [ok, setOk] = useState(0);
  const [fail, setFail] = useState(0);

  useEffect(() => {
    const s = getMerchantSession();
    if (!s) return;
    (async () => {
      await releaseMaturedProfits(s.id);
      const [{ data: w }, { data: ords }] = await Promise.all([
        supabase.from("merchant_wallets").select("balance, pending").eq("merchant_id", s.id).maybeSingle(),
        supabase.from("orders").select("id, status").eq("merchant_id", s.id),
      ]);
      if (w) {
        setBalance(Number(w.balance) || 0);
        setPending(Number(w.pending) || 0);
      }
      const list = ords || [];
      setOrders(list.length);
      setOk(list.filter((o) => o.status === "delivered").length);
      setFail(list.filter((o) => o.status === "cancelled").length);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">لوحة التاجر</h1>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-muted">رصيد متاح</p>
          <p className="text-xl font-bold">{formatPrice(balance)}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-muted">معلّق (انتظار)</p>
          <p className="text-xl font-bold">{formatPrice(pending)}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-muted">كل الطلبات</p>
          <p className="text-xl font-bold">{orders}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-muted">ناجح / فاشل</p>
          <p className="text-xl font-bold">
            {ok} / {fail}
          </p>
        </div>
      </div>
      <Link
        href="/merchant/new-order"
        className="block text-center bg-ink text-white py-3.5 rounded-full text-sm font-semibold"
      >
        إنشاء طلب لعميل
      </Link>
      <p className="text-xs text-muted leading-relaxed">
        السعر لا يقل عن سعر المتجر. بعد التسليم تُحتسب عمولتك معلّقة ثم تُحرَّر بعد يومين إن لم يحدث استرجاع.
      </p>
    </div>
  );
}
