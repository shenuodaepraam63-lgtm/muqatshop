"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy path → unified affiliate registration */
export default function MerchantRegisterRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/register/affiliate");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-[#718096]">
      جاري التحويل إلى تسجيل المسوق...
    </div>
  );
}
