"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/auth/AuthShell";
import {
  syncCustomerFromAuthUser,
  syncMerchantFromAuthUser,
} from "@/lib/auth-customer";

function strengthLabel(pw: string): { level: "weak" | "medium" | "strong"; text: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { level: "weak", text: "ضعيفة" };
  if (score <= 4) return { level: "medium", text: "متوسطة" };
  return { level: "strong", text: "قوية" };
}

function ResetInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => strengthLabel(password), [password]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (typeof window === "undefined") return;
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code") || sp.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          window.history.replaceState({}, "", "/reset-password");
          if (!cancelled) setHasSession(true);
          if (!cancelled) setReady(true);
          return;
        }
        const token_hash = url.searchParams.get("token_hash");
        const type = url.searchParams.get("type");
        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as "recovery" | "email" | "signup",
          });
          if (error) throw error;
          window.history.replaceState({}, "", "/reset-password");
          if (!cancelled) setHasSession(true);
          if (!cancelled) setReady(true);
          return;
        }
        const hash = window.location.hash?.replace(/^#/, "") || "";
        if (hash) {
          const params = new URLSearchParams(hash);
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
            window.history.replaceState({}, "", "/reset-password");
            if (!cancelled) setHasSession(true);
            if (!cancelled) setReady(true);
            return;
          }
        }
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!cancelled) {
          setHasSession(!!session);
          if (!session) setError("انتهت صلاحية الرابط أو غير صالح. اطلب رابط استعادة جديدًا.");
          setReady(true);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "رابط غير صالح أو منتهي الصلاحية");
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sp]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (password.length < 8) {
      setError("كلمة المرور يجب ألا تقل عن 8 أحرف (يُفضّل 12).");
      return;
    }
    if (password !== password2) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const role =
      typeof user?.user_metadata?.account_type === "string"
        ? user.user_metadata.account_type
        : typeof user?.user_metadata?.role === "string"
          ? user.user_metadata.role
          : "customer";
    if (role === "merchant" || role === "affiliate" || role === "supplier") {
      await syncMerchantFromAuthUser().catch(() => null);
    } else {
      await syncCustomerFromAuthUser().catch(() => null);
    }
    setLoading(false);
    setInfo("تم تحديث كلمة المرور بنجاح.");
  }

  const field =
    "w-full h-[50px] rounded-[10px] border border-[#E4E9F0] px-3 text-[15px] outline-none focus:border-[#3157D5]";

  return (
    <AuthShell
      title="إنشاء كلمة مرور جديدة"
      description="اختر كلمة مرور جديدة وآمنة لحسابك."
      footer={
        info ? (
          <Link href="/login" className="block text-center font-semibold text-[#3157D5]">
            تسجيل الدخول
          </Link>
        ) : (
          <Link href="/forgot-password" className="block text-center text-sm text-[#718096]">
            طلب رابط استعادة جديد
          </Link>
        )
      }
    >
      {!ready && <p className="text-sm text-[#718096] text-center">جاري التحقق من رابط الاستعادة...</p>}

      {ready && !hasSession && (
        <div className="space-y-3 text-center">
          <p className="text-sm text-[#D64C4C]">{error || "الرابط غير صالح"}</p>
          <Link href="/forgot-password" className="text-sm font-semibold text-[#3157D5] underline">
            طلب رابط استعادة جديد
          </Link>
        </div>
      )}

      {ready && hasSession && !info && (
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm font-semibold mb-1">كلمة المرور الجديدة</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                className={`${field} pe-14`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
                autoComplete="new-password"
                required
              />
              <button type="button" className="absolute inset-y-0 end-0 px-3 text-xs font-semibold text-[#718096]" onClick={() => setShow((s) => !s)}>
                {show ? "إخفاء" : "إظهار"}
              </button>
            </div>
            {password ? (
              <p
                className={`mt-1 text-xs font-semibold ${
                  strength.level === "weak"
                    ? "text-[#D64C4C]"
                    : strength.level === "medium"
                      ? "text-amber-600"
                      : "text-[#21865B]"
                }`}
              >
                قوة كلمة المرور: {strength.text}
              </p>
            ) : null}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">تأكيد كلمة المرور</label>
            <input
              type={show ? "text" : "password"}
              className={field}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="أعد كتابة كلمة المرور"
              autoComplete="new-password"
              required
            />
          </div>
          {error ? <p className="text-sm text-[#D64C4C]">{error}</p> : null}
          <button type="submit" disabled={loading} className="w-full h-[50px] rounded-[10px] bg-[#3157D5] text-white font-semibold disabled:opacity-60">
            {loading ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
          </button>
        </form>
      )}

      {info ? (
        <div className="rounded-xl border border-[#21865B]/25 bg-[#21865B]/5 px-4 py-3 text-sm text-[#21865B]">{info}</div>
      ) : null}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-[#718096]">جاري التحميل...</div>}>
      <ResetInner />
    </Suspense>
  );
}
