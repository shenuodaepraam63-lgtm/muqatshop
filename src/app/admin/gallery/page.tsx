"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Loader2, Plus, Trash2, GripVertical, Save } from "lucide-react";

type Slide = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
};

const TEMPLATES = [
  {
    id: "rounded_carousel",
    name: "كاروسيل دائري (مثل Elvora)",
    desc: "صورة كبيرة بحواف ناعمة + نقاط أسفل + تمرير تلقائي",
  },
  {
    id: "fade",
    name: "تلاشي ناعم",
    desc: "نفس الشكل مع انتقال opacity سلس",
  },
  {
    id: "peek",
    name: "معاينة جانبية",
    desc: "تمرير أفقي يظهر جزء من الشريحة التالية",
  },
  {
    id: "full",
    name: "عرض كامل العرض",
    desc: "من حافة لحافة بدون حواف داخلية",
  },
];

export default function AdminGalleryPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [template, setTemplate] = useState("rounded_carousel");
  const [autoplay, setAutoplay] = useState(true);
  const [intervalMs, setIntervalMs] = useState(4000);
  const [enabled, setEnabled] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [{ data }, { data: settingsRow }] = await Promise.all([
      supabase.from("gallery_slides").select("*").order("sort_order"),
      supabase.from("site_settings").select("value").eq("key", "gallery").maybeSingle(),
    ]);
    if (data) setSlides(data as Slide[]);
    if (settingsRow?.value) {
      const v = settingsRow.value as {
        enabled?: boolean;
        template?: string;
        autoplay?: boolean;
        interval_ms?: number;
      };
      if (typeof v.enabled === "boolean") setEnabled(v.enabled);
      if (v.template) setTemplate(v.template);
      if (typeof v.autoplay === "boolean") setAutoplay(v.autoplay);
      if (v.interval_ms) setIntervalMs(v.interval_ms);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setMsg("");
    const { error } = await supabase.from("site_settings").upsert({
      key: "gallery",
      value: {
        enabled,
        template,
        autoplay,
        interval_ms: intervalMs,
      },
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setMsg(error ? error.message : "تم حفظ إعدادات العرض");
  };

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setMsg("");
    try {
      const maxOrder = slides.reduce((m, s) => Math.max(m, s.sort_order), 0);
      let order = maxOrder;
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const url = await uploadToCloudinary(file);
        order += 1;
        const { data, error } = await supabase
          .from("gallery_slides")
          .insert({
            image_url: url,
            sort_order: order,
            is_active: true,
            title: null,
            subtitle: null,
            link_url: null,
          })
          .select()
          .single();
        if (error) throw error;
        if (data) setSlides((prev) => [...prev, data as Slide]);
      }
      setMsg("تم رفع الصور");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "فشل الرفع");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const updateSlide = async (id: string, patch: Partial<Slide>) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    await supabase.from("gallery_slides").update(patch).eq("id", id);
  };

  const removeSlide = async (id: string) => {
    if (!confirm("حذف هذه الصورة؟")) return;
    await supabase.from("gallery_slides").delete().eq("id", id);
    setSlides((prev) => prev.filter((s) => s.id !== id));
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = slides.findIndex((s) => s.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[idx], next[j]] = [next[j], next[idx]];
    const reordered = next.map((s, i) => ({ ...s, sort_order: i + 1 }));
    setSlides(reordered);
    await Promise.all(
      reordered.map((s) =>
        supabase.from("gallery_slides").update({ sort_order: s.sort_order }).eq("id", s.id)
      )
    );
  };

  if (loading) return <p className="text-muted text-sm">جاري التحميل...</p>;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">معرض الصور</h1>
        <p className="text-sm text-muted mt-1">
          السلايدر في أعلى الصفحة الرئيسية — نفس فكرة Elvora مع تحكم كامل
        </p>
      </div>

      {/* Display settings */}
      <section className="bg-white border border-[#e8e2d9] rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">نموذج العرض</h2>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 accent-ink"
          />
          إظهار المعرض في الرئيسية
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id)}
              className={`text-right rounded-xl border p-3 transition ${
                template === t.id
                  ? "border-ink bg-[#f8f5f0]"
                  : "border-[#e8e2d9] hover:border-ink/40"
              }`}
            >
              <p className="text-sm font-semibold">{t.name}</p>
              <p className="text-xs text-muted mt-1">{t.desc}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autoplay}
              onChange={(e) => setAutoplay(e.target.checked)}
              className="w-4 h-4 accent-ink"
            />
            تمرير تلقائي
          </label>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">كل</span>
            <input
              type="number"
              min={2000}
              step={500}
              value={intervalMs}
              onChange={(e) => setIntervalMs(Number(e.target.value) || 4000)}
              className="w-24 border border-[#e8e2d9] rounded-lg px-2 py-1.5"
            />
            <span className="text-muted">مللي ثانية</span>
          </div>
        </div>

        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-ink text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "جاري الحفظ..." : "حفظ إعدادات العرض"}
        </button>
      </section>

      {/* Upload */}
      <section className="bg-white border border-[#e8e2d9] rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">الصور</h2>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-[#e8e2d9] rounded-xl py-10 text-center hover:border-ink/40 transition"
        >
          {uploading ? (
            <span className="inline-flex items-center gap-2 text-muted text-sm">
              <Loader2 className="w-5 h-5 animate-spin" /> جاري الرفع...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <Plus className="w-5 h-5" /> إضافة صور للمعرض
            </span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addImages(e.target.files)}
        />

        {slides.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">لا توجد صور بعد</p>
        ) : (
          <ul className="space-y-4">
            {slides.map((s, i) => (
              <li
                key={s.id}
                className="flex gap-3 border border-[#e8e2d9] rounded-xl p-3 items-start"
              >
                <div className="flex flex-col gap-1 pt-2 text-muted">
                  <button type="button" onClick={() => move(s.id, -1)} disabled={i === 0} className="disabled:opacity-30">
                    ▲
                  </button>
                  <GripVertical className="w-4 h-4 mx-auto" />
                  <button
                    type="button"
                    onClick={() => move(s.id, 1)}
                    disabled={i === slides.length - 1}
                    className="disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
                <div className="relative w-24 h-28 rounded-lg overflow-hidden bg-[#f0ebe3] shrink-0">
                  <Image src={s.image_url} alt="" fill className="object-cover" sizes="96px" />
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  <input
                    value={s.title || ""}
                    onChange={(e) =>
                      setSlides((prev) =>
                        prev.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x))
                      )
                    }
                    onBlur={(e) => updateSlide(s.id, { title: e.target.value || null })}
                    placeholder="عنوان (اختياري)"
                    className="w-full border border-[#e8e2d9] rounded-lg px-3 py-1.5 text-sm"
                  />
                  <input
                    value={s.subtitle || ""}
                    onChange={(e) =>
                      setSlides((prev) =>
                        prev.map((x) =>
                          x.id === s.id ? { ...x, subtitle: e.target.value } : x
                        )
                      )
                    }
                    onBlur={(e) => updateSlide(s.id, { subtitle: e.target.value || null })}
                    placeholder="وصف فرعي (اختياري)"
                    className="w-full border border-[#e8e2d9] rounded-lg px-3 py-1.5 text-sm"
                  />
                  <input
                    value={s.link_url || ""}
                    onChange={(e) =>
                      setSlides((prev) =>
                        prev.map((x) =>
                          x.id === s.id ? { ...x, link_url: e.target.value } : x
                        )
                      )
                    }
                    onBlur={(e) => updateSlide(s.id, { link_url: e.target.value || null })}
                    placeholder="رابط عند الضغط (اختياري) مثل /products/..."
                    className="w-full border border-[#e8e2d9] rounded-lg px-3 py-1.5 text-sm"
                    dir="ltr"
                  />
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.is_active}
                      onChange={(e) => updateSlide(s.id, { is_active: e.target.checked })}
                      className="accent-ink"
                    />
                    نشط
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => removeSlide(s.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {msg && <p className="text-sm text-muted">{msg}</p>}
    </div>
  );
}
