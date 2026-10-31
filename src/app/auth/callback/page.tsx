"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  syncCustomerFromAuthUser,
  syncMerchantFromAuthUser,
} from "@/lib/auth-customer";
import { hydratePartnershipFromMetadata } from "@/lib/register-account";
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

        if (next.includes("reset-password")) {
          router.replace("/auth/reset-password");
          return;
        }

        // Ensure pending affiliate/supplier rows exist after confirm
        await hydratePartnershipFromMetadata();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const accountType =
          (typeof user?.user_metadata?.account_type === "string"
            ? user.user_metadata.account_type
            : null) ||
          roleParam ||
          (typeof user?.user_metadata?.role === "string"
            ? user.user_metadata.role
            : "customer");

        const isPartner =
          accountType === "merchant" ||
          accountType === "affiliate" ||
          accountType === "supplier";

        if (isPartner) {
          const synced = await syncMerchantFromAuthUser();
          if (!synced.ok) {
            // supplier may not need merchants row — still allow pending page
            if (accountType !== "supplier") throw new Error(synced.error);
          }
          setStatus("ok");
          setMessage("تم تأكيد بريدك بنجاح");
          setTimeout(() => {
            const dest = next.startsWith("/")
              ? next
              : accountType === "supplier"
                ? "/account/pending?type=supplier"
                : "/account/pending?type=affiliate";
            router.replace(dest);
          }, 600);
          return;
        }

        const synced = await syncCustomerFromAuthUser();
        if (!synced.ok) throw new Error(synced.error);

        setStatus("ok");
        setMessage("تم تأكيد حسابك بنجاح");
        setTimeout(() => {
          router.replace(next.startsWith("/") ? next : "/account");
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
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col items-center justify-center px-4">
      <BrandLogo size="md" className="mb-8" />
      <div className="w-full max-w-sm bg-white border border-[#E4E9F0] rounded-2xl p-6 text-center space-y-3">
        <p className={`text-sm ${status === "error" ? "text-[#D64C4C]" : "text-[#202B3C]"}`}>{message}</p>
        {status === "error" && (
          <div className="space-y-2 pt-2">
            <Link href="/forgot-password" className="block text-sm font-semibold text-[#3157D5] underline">
              طلب رابط استعادة جديد
            </Link>
            <Link href="/login" className="block text-xs text-[#718096]">
              تسجيل الدخول
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
        <div className="min-h-screen flex items-center justify-center text-sm text-[#718096]">...</div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
