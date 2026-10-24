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
      const { data: me } = await supabase
        .from("merchants")
        .select("commission_percent")
        .eq("id", s.id)
        .maybeSingle();
      const pct =
        me?.commission_percent != null
          ? Number(me.commission_percent)
          : settings.commission_percent;
      setCommission(pct);

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
  const waText = encodeURIComponent(
    `تصفّح منتجاتنا من هنا 👇\n${share}`
  );
  const waHref = `https://wa.me/?text=${waText}`;

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
          <p className="text-xs text-muted mb-1">رابط المشاركة (عمولة {commission}%)</p>
          <p className="text-xs break-all bg-[#f8f5f0] rounded-lg px-2 py-2 font-mono">{share}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              type="button"
              onClick={() => copy(share, "share")}
              className="text-sm border border-ink px-4 py-2 rounded-full"
            >
              {shareCopied ? "تم نسخ الرابط" : "نسخ الرابط"}
            </button>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-[#25D366] text-white px-4 py-2 rounded-full"
            >
              مشاركة واتساب
            </a>
          </div>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          ابعت الرابط لعملائك لعمولة النسبة، أو اطلب بنفسك من المتجر مع رفع السعر.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-muted">رصيد متاح</p>
          <p className="text-xl font-bold">{formatPrice(balance)}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-muted">معلّق</p>
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

      <div className="grid grid-cols-2 gap-2">
        <Link href="/shop" className="text-center bg-ink text-white py-3 rounded-full text-sm font-semibold">
          تسوق واطلب
        </Link>
        <Link href="/merchant/profile" className="text-center border border-ink py-3 rounded-full text-sm font-semibold">
          حسابي
        </Link>
      </div>
    </div>
  );
}
