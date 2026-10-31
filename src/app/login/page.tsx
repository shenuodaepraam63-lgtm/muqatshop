"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/auth/AuthShell";
import {
  loadAccountIdentity,
  mirrorLegacySession,
  resolvePostLoginPath,
} from "@/lib/account-identity";
import { syncCustomerFromAuthUser, syncMerchantFromAuthUser } from "@/lib/auth-customer";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suspended = sp.get("suspended") === "1";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed || !password) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
        return;
      }

      const { data, error: signErr } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });

      if (signErr) {
        const msg = signErr.message.toLowerCase();
        if (msg.includes("confirm") || msg.includes("not confirmed")) {
          setError("يرجى تأكيد بريدك الإلكتروني أولًا.");
        } else if (msg.includes("rate") || msg.includes("too many")) {
          setError("محاولات كثيرة، يرجى الانتظار والمحاولة لاحقًا.");
        } else {
          setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
        }
        return;
      }

      if (!data.user) {
        setError("تعذر الاتصال بالخادم، حاول مرة أخرى.");
        return;
      }

      // Ensure legacy rows stay linked (gradual migration)
      const identityRes = await loadAccountIdentity();
      if (!identityRes.ok) {
        setError(identityRes.error);
        return;
      }

      const { identity } = identityRes;
      if (!identity.isActive) {
        setError("تعذر الدخول إلى الحساب، يرجى التواصل مع الدعم.");
        await supabase.auth.signOut();
        return;
      }

      // Bridge old UI sessions
      if (identity.accountType === "affiliate" || identity.accountType === "supplier") {
        await syncMerchantFromAuthUser().catch(() => null);
      } else if (identity.accountType === "customer") {
        await syncCustomerFromAuthUser().catch(() => null);
      }

      mirrorLegacySession(identity);

      if (!remember) {
        // Session still managed by Supabase; UI preference only for now
      }

      router.replace(resolvePostLoginPath(identity));
    } catch {
      setError("تعذر الاتصال بالخادم، حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="مرحبًا بعودتك"
      description="سجّل الدخول إلى حسابك لمتابعة نشاطك على Muqatshop."
      brandingMessage="حساب واحد لجميع أدوار المنصة — عميل، مسوق، تاجر، وإدارة."
      footer={
        <p className="text-center text-sm text-[#718096]">
          ليس لديك حساب؟{" "}
          <Link href="/register" className="font-semibold text-[#3157D5] hover:underline">
            إنشاء حساب جديد
          </Link>
        </p>
      }
    >
      {suspended ? (
        <div className="mb-4 rounded-xl border border-[#D64C4C]/30 bg-[#D64C4C]/5 px-3 py-2 text-sm text-[#D64C4C]">
          تعذر الدخول إلى الحساب، يرجى التواصل مع الدعم.
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-semibold text-[#202B3C] mb-1.5">
            البريد الإلكتروني
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full h-[50px] rounded-[10px] border border-[#E4E9F0] bg-white px-3 text-[15px] outline-none focus:border-[#3157D5] transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-[#202B3C]">كلمة المرور</label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#3157D5] hover:underline"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              className="w-full h-[50px] rounded-[10px] border border-[#E4E9F0] bg-white px-3 pe-12 text-[15px] outline-none focus:border-[#3157D5] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute inset-y-0 end-0 px-3 text-xs font-semibold text-[#718096]"
            >
              {showPass ? "إخفاء" : "إظهار"}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-[#718096] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="rounded border-[#E4E9F0] text-[#3157D5] focus:ring-[#3157D5]"
          />
          تذكرني على هذا الجهاز
        </label>

        {error ? (
          <p className="text-sm text-[#D64C4C] animate-[fadeIn_180ms_ease-out]" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[50px] rounded-[10px] bg-[#3157D5] text-white text-[15px] font-semibold hover:bg-[#2848b8] transition-colors disabled:opacity-60"
        >
          {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-[#718096]">
        أو استخدم{" "}
        <Link href="/welcome" className="underline hover:text-[#3157D5]">
          صفحة الدخول الحالية
        </Link>{" "}
        مؤقتًا أثناء الانتقال.
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[#718096]">
          جاري التحميل...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
