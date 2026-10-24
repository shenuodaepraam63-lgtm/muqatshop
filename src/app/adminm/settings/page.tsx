"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminmSettingsPage() {
  const [minW, setMinW] = useState("200");
  const [holdDays, setHoldDays] = useState("2");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "merchant_settings")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && typeof data.value === "object") {
          const v = data.value as { min_withdrawal?: number; hold_days?: number };
          if (v.min_withdrawal != null) setMinW(String(v.min_withdrawal));
          if (v.hold_days != null) setHoldDays(String(v.hold_days));
        }
      });
  }, []);

  const save = async () => {
    const { error } = await supabase.from("site_settings").upsert({
      key: "merchant_settings",
      value: {
        min_withdrawal: Number(minW) || 200,
        hold_days: Number(holdDays) || 2,
      },
      updated_at: new Date().toISOString(),
    });
    setMsg(error ? error.message : "تم الحفظ");
  };

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">إعدادات التجار</h1>
      <div className="bg-white border rounded-2xl p-4 space-y-3">
        <div>
          <label className="text-sm block mb-1">الحد الأدنى للسحب (ج.م)</label>
          <input
            type="number"
            min={0}
            value={minW}
            onChange={(e) => setMinW(e.target.value)}
            className="w-full border rounded-xl px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-sm block mb-1">أيام الانتظار بعد التسليم</label>
          <input
            type="number"
            min={0}
            value={holdDays}
            onChange={(e) => setHoldDays(e.target.value)}
            className="w-full border rounded-xl px-3 py-2.5 text-sm"
          />
        </div>
        <button type="button" onClick={save} className="bg-ink text-white text-sm font-semibold px-5 py-2.5 rounded-full">
          حفظ
        </button>
        {msg && <p className="text-sm text-muted">{msg}</p>}
      </div>
    </div>
  );
}
