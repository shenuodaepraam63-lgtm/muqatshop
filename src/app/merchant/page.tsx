"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  getMerchantSession,
  releaseMaturedProfits,
  makeMerchantCode,
  getMerchantSettings,
} from "@/lib/merchant";
import { merchantShareUrl } from "@/lib/merchant-ref";
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
  const [shareCopied, setShareCopied] = useState(false);
  const [commission, setCommission] = useState(10);

  useEffect(() => {
    const s = getMerchantSession();
    if (!s) return;
    setCode(s.code || makeMerchantCode(s.id));
    (async () => {
      await releaseMaturedProfits(s.id);
      const settings = await getMerchantSettings();
      setCommission(settings.commission_percent);
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

  const copy = async (text: string, kind: "code" | "share") => {
    try {
      await navigator.clipboard.writeText(text);
      if (kind === "code") {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } else {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1500);
      }
    } catch {
      /* */
    }
  };

  const share = code ? merchantShareUrl(code, "/shop") : "";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">لوحتي</h1>

      <div className="bg-white border rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted">كود التاجر</p>
            <p className="font-mono text-lg font-bold tracking-wider">{code}</p>
          </div>
          <button type="button" onClick={() => copy(code, "code")} className="text-sm bg-ink text-white px-4 py-2 rounded-full">
            {copied ? "تم النسخ" : "نسخ الكود"}
          </button>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">رابط المشاركة (عمولة {commission}% للعميل)</p>
          <p className="text-xs break-all bg-[#f8f5f0] rounded-lg px-2 py-2 font-mono">{share}</p>
          <button
            type="button"
            onClick={() => copy(share, "share")}
            className="mt-2 text-sm border border-ink px-4 py-2 rounded-full"
          >
            {shareCopied ? "تم نسخ الرابط" : "نسخ رابط المتجر"}
          </button>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          ابعت الرابط لعملائك. لو طلبوا بأنفسهم تاخد نسبة العمولة. أو ادخل المتجر بنفسك وارفع السعر في السلة.
        </p>
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
        تسوق واطلب لعميل (رفع سعر)
      </Link>
    </div>
  );
}
