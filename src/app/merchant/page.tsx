"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  getMerchantSession,
  releaseMaturedProfits,
  makeMerchantCode,
} from "@/lib/merchant";
import { formatPrice } from "@/lib/utils";

export default function MerchantHome() {
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState(0);
  const [orders, setOrders] = useState(0);
  const [ok, setOk] = useState(0);
  const [fail, setFail] = useState(0);
  const [code, setCode] = useState("");
  const [unread, setUnread] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const s = getMerchantSession();
    if (!s) return;
    setCode(s.code || makeMerchantCode(s.id));
    (async () => {
      await releaseMaturedProfits(s.id);
      const [{ data: w }, { data: ords }, { count }] = await Promise.all([
        supabase.from("merchant_wallets").select("balance, pending").eq("merchant_id", s.id).maybeSingle(),
        supabase.from("orders").select("id, status").eq("merchant_id", s.id),
        supabase
          .from("merchant_messages")
          .select("id", { count: "exact", head: true })
          .eq("merchant_id", s.id)
          .eq("is_read", false),
      ]);
      if (w) {
        setBalance(Number(w.balance) || 0);
        setPending(Number(w.pending) || 0);
      }
      const list = ords || [];
      setOrders(list.length);
      setOk(list.filter((o) => o.status === "delivered").length);
      setFail(list.filter((o) => o.status === "cancelled").length);
      setUnread(count || 0);
    })();
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* */
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">لوحتي</h1>

      <div className="bg-white border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted">كود التاجر</p>
          <p className="font-mono text-lg font-bold tracking-wider">{code}</p>
        </div>
        <button type="button" onClick={copy} className="text-sm bg-ink text-white px-4 py-2 rounded-full">
          {copied ? "تم النسخ" : "نسخ الكود"}
        </button>
      </div>

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

      {unread > 0 && (
        <Link
          href="/merchant/messages"
          className="block text-center bg-amber-50 border border-amber-200 text-amber-900 py-3 rounded-2xl text-sm font-medium"
        >
          لديك {unread} رسالة جديدة
        </Link>
      )}

      <Link
        href="/shop"
        className="block text-center bg-ink text-white py-3.5 rounded-full text-sm font-semibold"
      >
        تسوق من المتجر واطلب لعميل
      </Link>

      <p className="text-xs text-muted leading-relaxed">
        ادخل المتجر → أضف للسلة → ارفع سعر البيع → أدخل بيانات العميل. بعد التسليم تُحتسب العمولة
        معلّقة ثم تُحرَّر بعد يومين.
      </p>
    </div>
  );
}
