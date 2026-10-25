"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { DetailSection, DetailSpecRow } from "@/lib/supabase";
import {
  Plus,
  Trash2,
  Loader2,
  BookmarkPlus,
  ChevronUp,
  ChevronDown,
  X,
  Table2,
  AlignLeft,
} from "lucide-react";

type Props = {
  value: DetailSection[];
  onChange: (sections: DetailSection[]) => void;
};

function normalizeSection(s: DetailSection): DetailSection {
  const kind = s.kind === "specs" || (s.rows && s.rows.length > 0) ? "specs" : "text";
  return {
    title: s.title || "",
    content: s.content || "",
    kind,
    rows: (s.rows || []).map((r) => ({
      label: r.label || "",
      value: r.value || "",
    })),
  };
}

export function DetailSectionsEditor({ value, onChange }: Props) {
  const [presets, setPresets] = useState<string[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [savingPreset, setSavingPreset] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newKind, setNewKind] = useState<"text" | "specs">("text");
  const [newContent, setNewContent] = useState("");

  const sections = value.map(normalizeSection);

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

  const commit = (next: DetailSection[]) => {
    onChange(next.map(normalizeSection));
  };

  const updateAt = (idx: number, patch: Partial<DetailSection>) => {
    commit(sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeAt = (idx: number) => {
    commit(sections.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[idx], next[j]] = [next[j], next[idx]];
    commit(next);
  };

  const addSection = (
    title: string,
    opts?: { kind?: "text" | "specs"; content?: string; rows?: DetailSpecRow[] }
  ) => {
    const t = title.trim();
    if (!t) return;
    const kind = opts?.kind || "text";
    commit([
      ...sections,
      {
        title: t,
        kind,
        content: opts?.content || "",
        rows: kind === "specs" ? opts?.rows || [{ label: "", value: "" }] : [],
      },
    ]);
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
      if (!error)
        setPresets((prev) => [...prev, t].sort((a, b) => a.localeCompare(b, "ar")));
    }
    setSavingPreset(null);
  };

  const removePreset = async (title: string) => {
    if (!confirm(`حذف القالب «${title}» من القائمة المحفوظة؟`)) return;
    await supabase.from("detail_section_presets").delete().eq("title", title);
    setPresets((prev) => prev.filter((p) => p !== title));
  };

  const updateRow = (sIdx: number, rIdx: number, patch: Partial<DetailSpecRow>) => {
    const s = sections[sIdx];
    const rows = [...(s.rows || [])];
    rows[rIdx] = { ...rows[rIdx], ...patch };
    updateAt(sIdx, { rows });
  };

  const addRow = (sIdx: number) => {
    const s = sections[sIdx];
    updateAt(sIdx, { rows: [...(s.rows || []), { label: "", value: "" }] });
  };

  const removeRow = (sIdx: number, rIdx: number) => {
    const s = sections[sIdx];
    updateAt(sIdx, { rows: (s.rows || []).filter((_, i) => i !== rIdx) });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-ink">مواصفات وتفاصيل المنتج (مرنة)</h2>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          كل منتج مختلف — أضف أي قسم تحتاجه. نوعان:{" "}
          <strong>نص حر</strong> (نقاط/وصف) أو{" "}
          <strong>جدول مواصفات</strong> (اسم الحقل + القيمة) زي أمازون. احفظ اسم
          القسم كقالب لإعادة استخدامه.
        </p>
      </div>

      <div className="rounded-xl border border-[#eae6df] bg-[#fbfaf8] p-3 space-y-2">
        <p className="text-[11px] font-medium text-[#666]">
          قوالب محفوظة — اضغط للإضافة (جدول مواصفات)
        </p>
        {loadingPresets ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted" />
        ) : presets.length === 0 ? (
          <p className="text-xs text-muted">لا قوالب بعد</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {presets.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 text-xs bg-white border border-[#e5e5e5] rounded-full pl-1 pr-2.5 py-1"
              >
                <button
                  type="button"
                  onClick={() => addSection(t, { kind: "specs" })}
                  className="hover:text-[#0042EB] px-1.5 font-medium"
                  title="إضافة كجدول مواصفات"
                >
                  + {t}
                </button>
                <button
                  type="button"
                  onClick={() => addSection(t, { kind: "text" })}
                  className="text-[#888] hover:text-ink px-0.5"
                  title="إضافة كنص حر"
                >
                  <AlignLeft className="w-3 h-3" />
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

      {sections.length > 0 && (
        <ul className="space-y-3">
          {sections.map((s, idx) => (
            <li
              key={idx}
              className="border border-[#eae6df] rounded-xl p-3 bg-white space-y-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={s.title}
                  onChange={(e) => updateAt(idx, { title: e.target.value })}
                  placeholder="اسم القسم"
                  className="flex-1 min-w-[140px] border border-[#e5e5e5] rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0042EB]/15"
                />
                <div className="flex rounded-lg border border-[#e5e5e5] overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => updateAt(idx, { kind: "text", rows: [] })}
                    className={`px-2.5 py-1.5 flex items-center gap-1 ${
                      s.kind !== "specs" ? "bg-ink text-white" : "bg-white text-[#666]"
                    }`}
                  >
                    <AlignLeft className="w-3 h-3" /> نص
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateAt(idx, {
                        kind: "specs",
                        rows: s.rows && s.rows.length ? s.rows : [{ label: "", value: "" }],
                      })
                    }
                    className={`px-2.5 py-1.5 flex items-center gap-1 ${
                      s.kind === "specs" ? "bg-ink text-white" : "bg-white text-[#666]"
                    }`}
                  >
                    <Table2 className="w-3 h-3" /> مواصفات
                  </button>
                </div>
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
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1 text-muted disabled:opacity-30">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === sections.length - 1} className="p-1 text-muted disabled:opacity-30">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => removeAt(idx)} className="p-1.5 text-muted hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {s.kind === "specs" ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-[#888]">صف لكل مواصفة — مثال: نوع الموصل ← USB Type-C</p>
                  {(s.rows || []).map((r, rIdx) => (
                    <div key={rIdx} className="flex gap-2 items-start">
                      <input
                        value={r.label}
                        onChange={(e) => updateRow(idx, rIdx, { label: e.target.value })}
                        placeholder="اسم الحقل (نوع الكابل)"
                        className="w-[38%] border border-[#e5e5e5] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0042EB]/15"
                      />
                      <input
                        value={r.value}
                        onChange={(e) => updateRow(idx, rIdx, { value: e.target.value })}
                        placeholder="القيمة (USB / Type-C ...)"
                        className="flex-1 border border-[#e5e5e5] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0042EB]/15"
                      />
                      <button type="button" onClick={() => removeRow(idx, rIdx)} className="p-1.5 text-muted hover:text-rose-600 shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addRow(idx)} className="text-xs text-[#0042EB] font-medium inline-flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> صف مواصفة
                  </button>
                </div>
              ) : (
                <textarea
                  value={s.content}
                  onChange={(e) => updateAt(idx, { content: e.target.value })}
                  placeholder="نص حر أو نقاط (سطر لكل نقطة)..."
                  className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm min-h-[88px] focus:outline-none focus:ring-2 focus:ring-[#0042EB]/15"
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="border border-dashed border-[#d4cfc4] rounded-xl p-3 space-y-2 bg-[#faf9f6]">
        <p className="text-xs font-medium text-[#555]">إضافة قسم جديد</p>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="اسم القسم (مثال: أهم النقاط البارزة)"
          className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0042EB]/15"
        />
        <div className="flex rounded-lg border border-[#e5e5e5] overflow-hidden text-xs w-fit bg-white">
          <button type="button" onClick={() => setNewKind("text")} className={`px-3 py-1.5 ${newKind === "text" ? "bg-ink text-white" : "text-[#666]"}`}>
            نص حر
          </button>
          <button type="button" onClick={() => setNewKind("specs")} className={`px-3 py-1.5 ${newKind === "specs" ? "bg-ink text-white" : "text-[#666]"}`}>
            جدول مواصفات
          </button>
        </div>
        {newKind === "text" && (
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="التفاصيل..."
            className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm min-h-[72px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0042EB]/15"
          />
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              addSection(newTitle, {
                kind: newKind,
                content: newContent,
                rows: newKind === "specs" ? [{ label: "", value: "" }] : [],
              })
            }
            disabled={!newTitle.trim()}
            className="inline-flex items-center gap-1.5 text-sm bg-[#0042EB] text-white px-3 py-2 rounded-xl disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            إضافة للمنتَج
          </button>
          <button
            type="button"
            onClick={() => savePreset(newTitle)}
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
