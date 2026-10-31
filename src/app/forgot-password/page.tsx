"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/auth/AuthShell";
import { authRedirectTo } from "@/lib/auth-customer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed.includes("@")) {
        setError("يرجى إدخال بريد إلكتروني صالح.");
        return;
      }

      // Always show generic success (no account enumeration)
      await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: authRedirectTo("/auth/callback?type=recovery&next=/auth/reset-password"),
      });

      setSent(true);
    } catch {
      setError("تعذر الاتصال بالخادم، حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="نسيت كلمة المرور؟"
      description="لا تقلق، أدخل بريدك الإلكتروني وسنرسل إليك رابطًا آمنًا لإعادة تعيين كلمة المرور."
      footer={
        <p className="text-center text-sm">
          <Link href="/login" className="font-semibold text-[#3157D5] hover:underline">
            العودة إلى تسجيل الدخول
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-[#21865B]/25 bg-[#21865B]/5 px-4 py-3 text-sm text-[#21865B] leading-relaxed">
          إذا كان البريد الإلكتروني مؤهلًا لاستعادة الحساب، فستصلك رسالة تحتوي على تعليمات إعادة
          تعيين كلمة المرور.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full h-[50px] rounded-[10px] border border-[#E4E9F0] px-3 text-[15px] outline-none focus:border-[#3157D5]"
            />
          </div>
          {error ? <p className="text-sm text-[#D64C4C]">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[50px] rounded-[10px] bg-[#3157D5] text-white font-semibold disabled:opacity-60"
          >
            {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
