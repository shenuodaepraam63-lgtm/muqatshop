"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { DetailSection } from "@/lib/supabase";
import {
  Plus,
  Trash2,
  Loader2,
  BookmarkPlus,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";

type Props = {
  value: DetailSection[];
  onChange: (sections: DetailSection[]) => void;
};

export function DetailSectionsEditor({ value, onChange }: Props) {
  const [presets, setPresets] = useState<string[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [savingPreset, setSavingPreset] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const loadPresets = async () => {
    setLoadingPresets(true);
    const { data } = await supabase
      .from("detail_section_presets")
      .select("title")
      .order("title");
    setPresets((data || []).map((r) => r.title as string));
    setLoadingPresets(false);
  };

  useEffect(() => {
    loadPresets();
  }, []);

  const updateAt = (idx: number, patch: Partial<DetailSection>) => {
    onChange(value.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  const addSection = (title: string, content = "") => {
    const t = title.trim();
    if (!t) return;
    onChange([...value, { title: t, content }]);
    setNewTitle("");
    setNewContent("");
  };

  const savePreset = async (title: string) => {
    const t = title.trim();
    if (!t) return;
    setSavingPreset(t);
    const exists = presets.some((p) => p.toLowerCase() === t.toLowerCase());
    if (!exists) {
      const { error } = await supabase
        .from("detail_section_presets")
        .insert({ title: t });
      if (!error) setPresets((prev) => [...prev, t].sort((a, b) => a.localeCompare(b, "ar")));
    }
    setSavingPreset(null);
  };

  const removePreset = async (title: string) => {
    if (!confirm(`حذف القالب «${title}» من القائمة المحفوظة؟`)) return;
    await supabase.from("detail_section_presets").delete().eq("title", title);
    setPresets((prev) => prev.filter((p) => p !== title));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-ink">تفاصيل سريعة (أقسام حرة)</h2>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          اكتب اسم القسم بنفسك (مثل: محتويات العبوة) واملأ التفاصيل. احفظ اسم القسم
          لاستخدامه في منتجات أخرى.
        </p>
      </div>

      <div className="rounded-xl border border-[#eae6df] bg-[#fbfaf8] p-3 space-y-2">
        <p className="text-[11px] font-medium text-[#666]">قوالب محفوظة — اضغط للإضافة السريعة</p>
        {loadingPresets ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted" />
        ) : presets.length === 0 ? (
          <p className="text-xs text-muted">لا قوالب بعد — احفظ اسماً من قسم أدناه</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {presets.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 text-xs bg-white border border-[#e5e5e5] rounded-full pl-1 pr-2.5 py-1"
              >
                <button
                  type="button"
                  onClick={() => addSection(t)}
                  className="hover:text-[#0042EB] px-1.5 font-medium"
                >
                  + {t}
                </button>
                <button
                  type="button"
                  title="حذف القالب"
                  onClick={() => removePreset(t)}
                  className="text-[#bbb] hover:text-rose-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {value.length > 0 && (
        <ul className="space-y-3">
          {value.map((s, idx) => (
            <li
              key={idx}
              className="border border-[#eae6df] rounded-xl p-3 bg-white space-y-2"
            >
              <div className="flex items-center gap-2">
                <input
                  value={s.title}
                  onChange={(e) => updateAt(idx, { title: e.target.value })}
                  placeholder="اسم القسم"
                  className="flex-1 border border-[#e5e5e5] rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0042EB]/15"
                />
                <button
                  type="button"
                  title="احفظ الاسم كقالب"
                  onClick={() => savePreset(s.title)}
                  disabled={savingPreset === s.title.trim()}
                  className="p-1.5 rounded-lg border text-[#0042EB] hover:bg-[#0042EB]/5 disabled:opacity-40"
                >
                  {savingPreset === s.title.trim() ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BookmarkPlus className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="p-1 text-muted disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === value.length - 1}
                  className="p-1 text-muted disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="p-1.5 text-muted hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={s.content}
                onChange={(e) => updateAt(idx, { content: e.target.value })}
                placeholder="التفاصيل (سطر لكل نقطة إن أردت)..."
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm min-h-[88px] focus:outline-none focus:ring-2 focus:ring-[#0042EB]/15"
              />
            </li>
          ))}
        </ul>
      )}

      <div className="border border-dashed border-[#d4cfc4] rounded-xl p-3 space-y-2 bg-[#faf9f6]">
        <p className="text-xs font-medium text-[#555]">إضافة قسم جديد</p>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="اسم القسم (مثال: الجمهور المستهدف)"
          className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0042EB]/15"
        />
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="التفاصيل..."
          className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm min-h-[72px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0042EB]/15"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addSection(newTitle, newContent)}
            disabled={!newTitle.trim()}
            className="inline-flex items-center gap-1.5 text-sm bg-[#0042EB] text-white px-3 py-2 rounded-xl disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            إضافة للمنتَج
          </button>
          <button
            type="button"
            onClick={() => {
              savePreset(newTitle);
            }}
            disabled={!newTitle.trim()}
            className="inline-flex items-center gap-1.5 text-sm border border-[#0042EB] text-[#0042EB] px-3 py-2 rounded-xl disabled:opacity-40"
          >
            <BookmarkPlus className="w-4 h-4" />
            حفظ الاسم كقالب فقط
          </button>
        </div>
      </div>
    </div>
  );
}
