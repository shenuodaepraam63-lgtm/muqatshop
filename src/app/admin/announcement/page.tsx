"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Save } from "lucide-react";

export default function AdminAnnouncementPage() {
  const [text, setText] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [returnPolicy, setReturnPolicy] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: ann }, { data: pol }] = await Promise.all([
        supabase.from("site_settings").select("value").eq("key", "announcement").maybeSingle(),
        supabase.from("site_settings").select("value").eq("key", "return_policy").maybeSingle(),
      ]);
      if (ann?.value) {
        const v = ann.value as { text?: string; enabled?: boolean };
        if (typeof v.text === "string") setText(v.text);
        if (typeof v.enabled === "boolean") setEnabled(v.enabled);
      }
      if (pol?.value) {
        if (typeof pol.value === "string") setReturnPolicy(pol.value);
        else if (typeof pol.value === "object" && pol.value && "text" in pol.value) {
          setReturnPolicy(String((pol.value as { text?: string }).text || ""));
        }
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg("");
    const updates = [
      supabase.from("site_settings").upsert({
        key: "announcement",
        value: { text, enabled },
        updated_at: new Date().toISOString(),
      }),
      supabase.from("site_settings").upsert({
        key: "return_policy",
        value: { text: returnPolicy.trim() },
        updated_at: new Date().toISOString(),
      }),
    ];
    const results = await Promise.all(updates);
    setSaving(false);
    const err = results.find((r) => r.error)?.error;
    setMsg(err ? err.message : "تم الحفظ");
  };

  if (loading) return <p className="text-sm text-muted">جاري التحميل...</p>;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">إعدادات المتجر</h1>
        <p className="text-sm text-muted mt-1">الشريط الإعلاني وسياسة الاسترجاع — تظهر ديناميكيًا في الموقع</p>
      </div>

      <section className="bg-white border border-[#e8e2d9] rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">الشريط الإعلاني</h2>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 accent-ink"
          />
          إظهار الشريط
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full border border-[#e8e2d9] rounded-xl px-4 py-3 text-sm"
          placeholder="نص الشريط المتحرك..."
        />
      </section>

      <section className="bg-white border border-[#e8e2d9] rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">سياسة الاستبدال والاسترجاع</h2>
        <p className="text-xs text-muted">
          تظهر في صفحة المنتج داخل قسم قابل للطي — اتركها فارغة لإخفاء القسم
        </p>
        <textarea
          value={returnPolicy}
          onChange={(e) => setReturnPolicy(e.target.value)}
          rows={6}
          className="w-full border border-[#e8e2d9] rounded-xl px-4 py-3 text-sm"
          placeholder="اكتب سياسة الاستبدال والاسترجاع..."
        />
      </section>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 bg-ink text-white text-sm font-semibold px-6 py-3 rounded-xl disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? "جاري الحفظ..." : "حفظ"}
      </button>
      {msg && <p className="text-sm text-muted">{msg}</p>}
    </div>
  );
}
