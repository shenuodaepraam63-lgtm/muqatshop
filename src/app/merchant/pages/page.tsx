"use client";

import { useEffect, useState } from "react";
import { FileStack, Plus, Trash2 } from "lucide-react";
import { getMerchantSession } from "@/lib/merchant";
import {
  loadMarketerPages,
  saveMarketerPages,
  type MarketerPage,
} from "@/lib/marketer-local";

export default function MarketerPagesPage() {
  const [pages, setPages] = useState<MarketerPage[]>([]);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!getMerchantSession()) return;
    setPages(loadMarketerPages());
  }, []);

  const persist = (list: MarketerPage[]) => {
    setPages(list);
    saveMarketerPages(list);
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const item: MarketerPage = {
      id: crypto.randomUUID(),
      name: name.trim(),
      note: note.trim(),
      created_at: new Date().toISOString(),
    };
    persist([item, ...pages]);
    setName("");
    setNote("");
  };

  const remove = (id: string) => persist(pages.filter((p) => p.id !== id));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">صفحاتي</h1>
        <p className="text-sm text-muted mt-1">
          تصنيف تنظيمي داخلي — عند تسجيل الأوردر تقدر تربط الطلب بصفحة معينة
          لمتابعة أداء كل قناة
        </p>
      </div>

      <form
        onSubmit={add}
        className="bg-white border border-[#eae6df] rounded-2xl p-4 space-y-3"
      >
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> إضافة صفحة
        </h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم الصفحة (مثال: فيسبوك — مقاطف الشتاء)"
          className="w-full border rounded-xl px-3 py-2.5 text-sm"
          required
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ملاحظة اختيارية"
          className="w-full border rounded-xl px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          className="bg-ink text-white text-sm px-5 py-2.5 rounded-full font-semibold"
        >
          حفظ الصفحة
        </button>
      </form>

      {pages.length === 0 ? (
        <div className="bg-white border border-[#eae6df] rounded-2xl p-10 text-center space-y-2">
          <FileStack className="w-10 h-10 text-muted mx-auto" strokeWidth={1.25} />
          <p className="text-sm text-muted">لم تضف صفحات بعد</p>
          <p className="text-xs text-muted">
            بعد الإضافة هتظهر في قائمة «إضافة أوردر»
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {pages.map((p) => (
            <li
              key={p.id}
              className="bg-white border border-[#eae6df] rounded-2xl px-4 py-3 flex items-start justify-between gap-3"
            >
              <div>
                <p className="font-medium text-sm">{p.name}</p>
                {p.note && <p className="text-xs text-muted mt-0.5">{p.note}</p>}
              </div>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="text-muted hover:text-sale p-1"
                aria-label="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
