"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { supabase } from "@/lib/supabase";
import { authRedirectTo } from "@/lib/auth-customer";

function VerifyInner() {
  const sp = useSearchParams();
  const email = sp.get("email") || "";
  const type = sp.get("type") || "customer";
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  async function resend() {
    if (!email || cooldown > 0) return;
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: authRedirectTo(
            `/auth/callback?next=${encodeURIComponent(
              type === "customer" ? "/account" : `/account/pending?type=${type}`
            )}`
          ),
        },
      });
      if (error) {
        setErr(error.message);
        return;
      }
      setMsg("تم إرسال رسالة التأكيد مجددًا. راجع بريدك.");
      setCooldown(60);
      const t = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            clearInterval(t);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch {
      setErr("تعذر الإرسال، حاول لاحقًا.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="تحقق من بريدك الإلكتروني"
      description="أرسلنا إليك رسالة تحتوي على رابط لتأكيد بريدك الإلكتروني. افتح الرسالة واضغط على الرابط لإكمال إنشاء حسابك."
      footer={
        <p className="text-center text-sm">
          <Link href="/login" className="font-semibold text-[#3157D5] hover:underline">
            العودة لتسجيل الدخول
          </Link>
        </p>
      }
    >
      {email ? (
        <p className="text-sm text-[#718096] mb-4">
          تم الإرسال إلى: <span className="font-semibold text-[#202B3C]">{email}</span>
        </p>
      ) : null}

      <div className="rounded-xl border border-[#E4E9F0] bg-[#F6F8FB] px-4 py-3 text-sm text-[#718096] mb-4">
        بانتظار تأكيد البريد الإلكتروني.
      </div>

      {msg ? <p className="text-sm text-[#21865B] mb-2">{msg}</p> : null}
      {err ? <p className="text-sm text-[#D64C4C] mb-2">{err}</p> : null}

      <button
        type="button"
        disabled={loading || cooldown > 0 || !email}
        onClick={resend}
        className="w-full h-[50px] rounded-[10px] bg-[#3157D5] text-white font-semibold disabled:opacity-50"
      >
        {cooldown > 0
          ? `إعادة الإرسال خلال ${cooldown}ث`
          : loading
            ? "جاري الإرسال..."
            : "إعادة إرسال رسالة التأكيد"}
      </button>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <VerifyInner />
    </Suspense>
  );
}
