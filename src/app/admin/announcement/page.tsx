"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminAnnouncementPage() {
  const [enabled, setEnabled] = useState(true);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "announcement")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          const v = data.value as {
            enabled?: boolean;
            text?: string;
            messages?: string[];
          };
          if (typeof v.enabled === "boolean") setEnabled(v.enabled);
          if (Array.isArray(v.messages) && v.messages.length) {
            setText(v.messages.join(" · "));
          } else if (v.text) {
            setText(v.text);
          }
        }
        setLoading(false);
      });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const messages = text
      .split(/[|·\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const value = {
      enabled,
      text: text.trim(),
      messages: messages.length ? messages : [text.trim()].filter(Boolean),
    };
    const { error } = await supabase.from("site_settings").upsert({
      key: "announcement",
      value,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setMsg(error ? error.message : "تم الحفظ بنجاح");
  };

  if (loading) return <p className="text-muted text-sm">جاري التحميل...</p>;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-2">الشريط الإعلاني</h1>
      <p className="text-sm text-muted mb-6">
        العبارة اللي بتتحرك فوق الموقع. افصل بين الرسائل بـ · أو سطر جديد.
      </p>

      <form onSubmit={save} className="bg-white border border-[#e8e2d9] rounded-2xl p-6 space-y-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 accent-ink"
          />
          إظهار الشريط
        </label>

        <div>
          <label className="block text-sm font-medium mb-1.5">نص الإعلان</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full border border-[#e8e2d9] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ink/15"
            placeholder="توصيل مجاني فوق 1000 ج · تصميمك قصتك"
          />
        </div>

        {msg && (
          <p className={`text-sm ${msg.includes("نجاح") ? "text-green-700" : "text-red-600"}`}>
            {msg}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-ink text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "جاري الحفظ..." : "حفظ"}
        </button>
      </form>
    </div>
  );
}
