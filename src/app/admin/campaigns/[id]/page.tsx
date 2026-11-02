"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CampaignForm } from "@/components/admin/campaigns/CampaignForm";
import type { CampaignRow } from "@/lib/campaigns";
import { Loader2 } from "lucide-react";

export default function EditCampaignPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [row, setRow] = useState<CampaignRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    supabase
      .from("gallery_slides")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setErr(error.message);
        setRow((data as CampaignRow) || null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> جاري التحميل...
      </div>
    );
  }

  if (!row) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-600">{err || "الحملة غير موجودة"}</p>
        <Link href="/admin/campaigns" className="text-sm text-[#3157D5]">
          العودة
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/campaigns" className="text-xs text-muted hover:text-ink">
          ← العودة للحملات
        </Link>
        <h1 className="text-2xl font-bold mt-2">تعديل الحملة</h1>
        <p className="text-sm text-muted">{row.name || row.title}</p>
      </div>
      <CampaignForm initial={row} />
    </div>
  );
}
