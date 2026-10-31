"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy path → unified login */
export default function MerchantLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-[#718096]">
      جاري التحويل إلى تسجيل الدخول الموحد...
    </div>
  );
}
