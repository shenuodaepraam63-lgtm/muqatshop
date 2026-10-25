"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMerchantSession } from "@/lib/merchant";
import { Loader2 } from "lucide-react";

/**
 * التحويل لصفحة المنتج الأصلية في المتجر
 * (نفس العرض والصور والمعرض اللي المنصة متعودة عليه)
 */
export default function MarketerProductRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");

  useEffect(() => {
    if (!getMerchantSession() || !id) {
      router.replace("/merchant/login");
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("slug")
        .eq("id", id)
        .maybeSingle();
      if (data?.slug) {
        router.replace(`/products/${encodeURIComponent(data.slug)}`);
      } else {
        router.replace("/merchant/catalog");
      }
    })();
  }, [id, router]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-muted text-sm gap-2">
      <Loader2 className="w-6 h-6 animate-spin" />
      جاري فتح صفحة المنتج...
    </div>
  );
}
