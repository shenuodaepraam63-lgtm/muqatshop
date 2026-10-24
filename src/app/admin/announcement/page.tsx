"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Save } from "lucide-react";

export default function AdminAnnouncementPage() {
  const [text, setText] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [returnPolicy, setReturnPolicy] = useState("");
  const [sizeGuide, setSizeGuide] = useState("");
  const [shipFee, setShipFee] = useState("80");
  const [freeOver, setFreeOver] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const keys = ["announcement", "return_policy", "size_guide", "shipping"];
      const results = await Promise.all(
        keys.map((key) =>
          supabase.from("site_settings").select("value").eq("key", key).maybeSingle()
        )
      );
      const [ann, pol, size, ship] = results;

      if (ann.data?.value) {
        const v = ann.data.value as { text?: string; enabled?: boolean };
        if (typeof v.text === "string") setText(v.text);
        if (typeof v.enabled === "boolean") setEnabled(v.enabled);
      }
      if (pol.data?.value) {
        if (typeof pol.data.value === "string") setReturnPolicy(pol.data.value);
        else if (typeof pol.data.value === "object" && pol.data.value && "text" in pol.data.value) {
          setReturnPolicy(String((pol.data.value as { text?: string }).text || ""));
        }
      }
      if (size.data?.value) {
        if (typeof size.data.value === "string") setSizeGuide(size.data.value);
        else if (typeof size.data.value === "object" && size.data.value && "text" in size.data.value) {
          setSizeGuide(String((size.data.value as { text?: string }).text || ""));
        }
      }
      if (ship.data?.value && typeof ship.data.value === "object") {
        const v = ship.data.value as { fee?: number; free_over?: number | null };
        if (typeof v.fee === "number") setShipFee(String(v.fee));
        if (typeof v.free_over === "number") setFreeOver(String(v.free_over));
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg("");
    const now = new Date().toISOString();
    const updates = [
      supabase.from("site_settings").upsert({
        key: "announcement",
        value: { text, enabled },
        updated_at: now,
      }),
      supabase.from("site_settings").upsert({
        key: "return_policy",
        value: { text: returnPolicy.trim() },
        updated_at: now,
      }),
      supabase.from("site_settings").upsert({
        key: "size_guide",
        value: { text: sizeGuide.trim() },
        updated_at: now,
      }),
      supabase.from("site_settings").upsert({
        key: "shipping",
        value: {
          fee: Number(shipFee) || 80,
          free_over: freeOver ? Number(freeOver) : null,
        },
        updated_at: now,
      }),
    ];
    const results = await Promise.all(updates);
    setSaving(false);
    const err = results.find((r) => r.error)?.error;
    setMsg(err ? err.message : "تم الحفظ");
  };

  if (loading) return <p className="text-sm text-muted">جاري التحميل...</p>;

  const field = "w-full border border-[#e8e2d9] rounded-xl px-4 py-3 text-sm";

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">إعدادات المتجر</h1>
        <p className="text-sm text-muted mt-1">إعلان · شحن · سياسات · دليل مقاسات</p>
      </div>

      <section className="bg-white border border-[#e8e2d9] rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">الشريط الإعلاني</h2>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4 accent-ink" />
          إظهار الشريط
        </label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className={field} />
      </section>

      <section className="bg-white border border-[#e8e2d9] rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">الشحن</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm mb-1 block">رسوم التوصيل (ج.م)</label>
            <input type="number" min="0" value={shipFee} onChange={(e) => setShipFee(e.target.value)} className={field} />
          </div>
          <div>
            <label className="text-sm mb-1 block">شحن مجاني فوق (ج.م) — اختياري</label>
            <input type="number" min="0" value={freeOver} onChange={(e) => setFreeOver(e.target.value)} className={field} placeholder="مثال: 500" />
          </div>
        </div>
      </section>

      <section className="bg-white border border-[#e8e2d9] rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">سياسة الاستبدال والاسترجاع</h2>
        <textarea value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} rows={5} className={field} />
      </section>

      <section className="bg-white border border-[#e8e2d9] rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">دليل المقاسات (للملابس)</h2>
        <p className="text-xs text-muted">يظهر في صفحة المنتج لنوع ملابس — اتركه فارغًا للجدول الافتراضي</p>
        <textarea value={sizeGuide} onChange={(e) => setSizeGuide(e.target.value)} rows={6} className={field} />
      </section>

      <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-ink text-white text-sm font-semibold px-6 py-3 rounded-xl disabled:opacity-50">
        <Save className="w-4 h-4" />
        {saving ? "جاري الحفظ..." : "حفظ"}
      </button>
      {msg && <p className="text-sm text-muted">{msg}</p>}
    </div>
  );
}
