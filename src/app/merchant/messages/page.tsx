"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMerchantSession } from "@/lib/merchant";

type Msg = { id: string; body: string; is_read: boolean; created_at: string };

export default function MerchantMessagesPage() {
  const [list, setList] = useState<Msg[]>([]);

  useEffect(() => {
    const s = getMerchantSession();
    if (!s) return;
    (async () => {
      const { data } = await supabase
        .from("merchant_messages")
        .select("id, body, is_read, created_at")
        .eq("merchant_id", s.id)
        .order("created_at", { ascending: false });
      setList((data as Msg[]) || []);
      await supabase
        .from("merchant_messages")
        .update({ is_read: true })
        .eq("merchant_id", s.id)
        .eq("is_read", false);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">الرسائل</h1>
      {list.length === 0 && <p className="text-sm text-muted">لا توجد رسائل</p>}
      {list.map((m) => (
        <div
          key={m.id}
          className={`rounded-2xl border p-4 text-sm ${
            m.is_read ? "bg-white" : "bg-amber-50 border-amber-200"
          }`}
        >
          <p className="leading-relaxed">{m.body}</p>
          <p className="text-xs text-muted mt-2">
            {new Date(m.created_at).toLocaleString("ar-EG")}
          </p>
        </div>
      ))}
    </div>
  );
}
