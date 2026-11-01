"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
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
      const next =
        type === "customer" ? "/account" : `/account/pending?type=${type}`;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: authRedirectTo(
            `/auth/callback?next=${encodeURIComponent(next)}`
          ),
        },
      });
      if (error) {
        const m = error.message.toLowerCase();
        if (m.includes("rate") || m.includes("security")) {
          setErr("محاولات كثيرة، يرجى الانتظار ثم إعادة المحاولة.");
        } else {
          setErr(error.message);
        }
        return;
      }
      setMsg("تم إرسال رسالة التأكيد مجددًا. راجع بريدك (وصندوق الرسائل غير المرغوب فيها).");
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
      brandingMessage="تأكيد البريد يتم عبر رابط آمن في الرسالة — وليس برمز OTP في الواجهة."
      footer={
        <p className="text-center text-sm">
          <Link href="/login" className="font-semibold text-[#3157D5] hover:underline">
            العودة لتسجيل الدخول
          </Link>
        </p>
      }
    >
      <div className="mb-5 flex justify-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF3FF] text-[#3157D5]">
          <MailCheck className="h-7 w-7" strokeWidth={1.75} />
        </span>
      </div>

      {email ? (
        <p className="text-sm text-[#718096] mb-4 text-center">
          تم الإرسال إلى: <span className="font-semibold text-[#202B3C]">{email}</span>
        </p>
      ) : (
        <p className="text-sm text-[#718096] mb-4 text-center">
          إن لم تجد الرسالة، أعد التسجيل أو اطلب رابطًا جديدًا بعد إدخال البريد.
        </p>
      )}

      <div className="rounded-xl border border-[#E4E9F0] bg-[#F6F8FB] px-4 py-3 text-sm text-[#718096] mb-4 text-center">
        بانتظار تأكيد البريد الإلكتروني.
      </div>

      {msg ? <p className="text-sm text-[#21865B] mb-2 text-center">{msg}</p> : null}
      {err ? (
        <p className="text-sm text-[#D64C4C] mb-2 text-center" role="alert">
          {err}
        </p>
      ) : null}

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
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[#718096]">
          جاري التحميل...
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}
