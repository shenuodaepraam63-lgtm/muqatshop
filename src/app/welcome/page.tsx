"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Redirect legacy /welcome to unified auth routes (MQS-AUTH-002). */
function WelcomeRedirect() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const tab = sp.get("tab");
    const mode = sp.get("mode");
    const next = sp.get("next");

    if (mode === "forgot") {
      router.replace("/forgot-password");
      return;
    }
    if (mode === "register") {
      if (tab === "merchant") {
        router.replace("/register/affiliate");
        return;
      }
      router.replace("/register/customer");
      return;
    }
    const q = next ? `?next=${encodeURIComponent(next)}` : "";
    router.replace(`/login${q}`);
  }, [router, sp]);

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-[#718096]">
      جاري التحويل إلى صفحة الحسابات الجديدة...
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <WelcomeRedirect />
    </Suspense>
  );
}
