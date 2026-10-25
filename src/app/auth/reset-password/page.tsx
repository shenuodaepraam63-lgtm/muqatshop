"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  syncCustomerFromAuthUser,
  syncMerchantFromAuthUser,
} from "@/lib/auth-customer";
import { BrandLogo } from "@/components/brand/BrandLogo";

/**
 * صفحة تعيين كلمة مرور جديدة بعد رابط الاستعادة من الإيميل.
 * تدعم:
 * - ?code=... (PKCE)
 * - #access_token=...&type=recovery (implicit)
 * - جلسة موجودة بعد /auth/callback
 */
function ResetPasswordInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("جاري التحقق من رابط الاستعادة...");

  useEffect(() => {
    let cancelled = false;

    const establishSession = async () => {
      try {
        if (typeof window === "undefined") return false;

        const href = window.location.href;
        const url = new URL(href);

        // 1) PKCE code
        const code = url.searchParams.get("code") || sp.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          // نظّف الـ URL من الكود
          window.history.replaceState({}, "", "/auth/reset-password");
          return true;
        }

        // 2) token_hash من بعض قوالب البريد
        const token_hash = url.searchParams.get("token_hash");
        const type = url.searchParams.get("type");
        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as "recovery" | "email" | "signup",
          });
          if (error) throw error;
          window.history.replaceState({}, "", "/auth/reset-password");
          return true;
        }

        // 3) Hash tokens (#access_token&type=recovery)
        const hash = window.location.hash?.replace(/^#/, "") || "";
        if (hash) {
          const params = new URLSearchParams(hash);
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) throw error;
            window.history.replaceState({}, "", "/auth/reset-password");
            return true;
          }
        }

        // 4) جلسة قائمة مسبقًا
        const {
          data: { session },
        } = await supabase.auth.getSession();
        return !!session;
      } catch (e: unknown) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "رابط غير صالح أو منتهي الصلاحية"
          );
        }
        return false;
      }
    };

    (async () => {
      const ok = await establishSession();
      if (cancelled) return;
      if (ok) {
        setHasSession(true);
        setStatusText("يمكنك تعيين كلمة مرور جديدة");
      } else if (!error) {
        setError("انتهت صلاحية الرابط أو غير صالح. اطلب رابط استعادة جديدًا.");
      }
      setReady(true);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        setHasSession(true);
        setError("");
        setStatusText("يمكنك تعيين كلمة مرور جديدة");
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (password.length < 6) {
      setError("كلمة المرور 6 أحرف على الأقل");
      return;
    }
    if (password !== password2) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    setLoading(true);

    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }

    // مزامنة ملف العميل أو التاجر حسب metadata
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const role =
      typeof user?.user_metadata?.role === "string"
        ? user.user_metadata.role
        : "customer";

    if (role === "merchant") {
      await syncMerchantFromAuthUser();
    } else {
      await syncCustomerFromAuthUser();
    }

    setLoading(false);
    setInfo("تم تحديث كلمة المرور بنجاح");
    setTimeout(() => {
      router.replace(role === "merchant" ? "/merchant" : "/");
    }, 900);
  };

  const field =
    "w-full border border-[#e8e2d9] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ink/20 bg-white";

  return (
    <div className="min-h-screen bg-[#f8f5f0] flex flex-col items-center justify-center px-4">
      <BrandLogo size="md" className="mb-8" />
      <div className="w-full max-w-sm bg-white border border-[#e8e2d9] rounded-2xl p-6 space-y-4">
        <h1 className="text-lg font-bold text-center">تعيين كلمة مرور جديدة</h1>

        {!ready && (
          <p className="text-sm text-muted text-center">{statusText}</p>
        )}

        {ready && !hasSession && (
          <div className="space-y-3 text-center">
            <p className="text-sm text-sale">{error || "الرابط غير صالح"}</p>
            <Link
              href="/welcome?tab=customer&mode=forgot"
              className="block text-sm font-semibold underline"
            >
              طلب رابط استعادة جديد (عميل)
            </Link>
            <Link href="/merchant/login" className="block text-xs text-muted underline">
              استعادة من دخول التاجر
            </Link>
          </div>
        )}

        {ready && hasSession && (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-xs text-muted text-center">{statusText}</p>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور الجديدة"
              className={field}
              autoComplete="new-password"
            />
            <input
              type="password"
              required
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="تأكيد كلمة المرور"
              className={field}
              autoComplete="new-password"
            />
            {error && <p className="text-sm text-sale">{error}</p>}
            {info && <p className="text-sm text-green-700">{info}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-50"
            >
              {loading ? "..." : "حفظ كلمة المرور"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-muted">
          جاري التحميل...
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
