"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { saveMerchantRef } from "@/lib/merchant-ref";
import { getMerchantSession } from "@/lib/merchant";

/** يلتقط ?m=CODE من أي صفحة ويحفظ إحالة التاجر 30 يوم */
export function MerchantRefCapture() {
  const sp = useSearchParams();

  useEffect(() => {
    const code = sp.get("m")?.trim().toUpperCase();
    if (!code) return;

    // لو التاجر نفسه فاتح رابطه، متضيعش الإحالة على نفسه كعميل
    const session = getMerchantSession();
    if (session?.code?.toUpperCase() === code) return;

    (async () => {
      const { data } = await supabase
        .from("merchants")
        .select("id, name, code, is_active")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();
      if (data?.id) {
        saveMerchantRef({
          code: data.code || code,
          merchantId: data.id,
          name: data.name,
        });
      }
    })();
  }, [sp]);

  return null;
}
