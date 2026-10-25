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

function CallbackInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const roleParam = sp.get("role");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("جاري تأكيد الرابط...");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const href = typeof window !== "undefined" ? window.location.href : "";
        const url = new URL(href);
        const code = url.searchParams.get("code");
        const token_hash = url.searchParams.get("token_hash");
        const typeQ = url.searchParams.get("type") || sp.get("type") || "";

        const hash = url.hash?.replace(/^#/, "") || "";
        const hashParams = new URLSearchParams(hash);
        const hashType = hashParams.get("type") || "";

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (token_hash && (typeQ || hashType)) {
          const t = (typeQ || hashType) as
            | "signup"
            | "invite"
            | "magiclink"
            | "recovery"
            | "email";
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: t,
          });
          if (error) throw error;
        } else if (hashParams.get("access_token") && hashParams.get("refresh_token")) {
          const { error } = await supabase.auth.setSession({
            access_token: hashParams.get("access_token")!,
            refresh_token: hashParams.get("refresh_token")!,
          });
          if (error) throw error;
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) {
            throw new Error("رابط غير صالح أو منتهي الصلاحية");
          }
        }

        if (cancelled) return;

        // استعادة كلمة المرور → صفحة تعيين كلمة جديدة دائمًا
        const isRecovery =
          typeQ === "recovery" ||
          hashType === "recovery" ||
          sp.get("type") === "recovery";

        if (isRecovery) {
          setStatus("ok");
          setMessage("تم التحقق — جاري فتح صفحة كلمة المرور الجديدة");
          router.replace("/auth/reset-password");
          return;
        }

        // أحيانًا Supabase لا يمرّر type=recovery في الـ query بعد code exchange
        // إن وُجدت معلمة next تشير لصفحة الباسورد
        if (next.includes("reset-password")) {
          router.replace("/auth/reset-password");
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();
        const metaRole =
          roleParam ||
          (typeof user?.user_metadata?.role === "string"
            ? user.user_metadata.role
            : "customer");

        if (metaRole === "merchant") {
          const synced = await syncMerchantFromAuthUser();
          if (!synced.ok) throw new Error(synced.error);
          setStatus("ok");
          setMessage("تم تأكيد بريد التاجر بنجاح");
          setTimeout(() => {
            router.replace(next.startsWith("/") ? next : "/merchant");
          }, 600);
          return;
        }

        const synced = await syncCustomerFromAuthUser();
        if (!synced.ok) throw new Error(synced.error);

        setStatus("ok");
        setMessage("تم تأكيد حسابك بنجاح");
        setTimeout(() => {
          router.replace(next.startsWith("/") ? next : "/");
        }, 600);
      } catch (e: unknown) {
        if (cancelled) return;
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "فشل تأكيد الرابط");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, next, sp, roleParam]);

  return (
    <div className="min-h-screen bg-[#f8f5f0] flex flex-col items-center justify-center px-4">
      <BrandLogo size="md" className="mb-8" />
      <div className="w-full max-w-sm bg-white border border-[#e8e2d9] rounded-2xl p-6 text-center space-y-3">
        <p className={`text-sm ${status === "error" ? "text-sale" : "text-ink"}`}>{message}</p>
        {status === "error" && (
          <div className="space-y-2 pt-2">
            <Link
              href="/welcome?tab=customer&mode=forgot"
              className="block text-sm font-semibold underline"
            >
              طلب رابط استعادة جديد
            </Link>
            <Link href="/welcome?tab=customer" className="block text-xs text-muted">
              دخول عميل
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-muted">...</div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
