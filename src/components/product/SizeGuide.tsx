"use client";

import { useState } from "react";

const DEFAULT_CLOTHING = `
المقاس | الصدر (سم) | الوسط (سم) | الطول تقريباً
XS | 86–90 | 70–74 | قصير
S | 90–94 | 74–78 | —
M | 94–98 | 78–82 | —
L | 98–102 | 82–86 | —
XL | 102–108 | 86–92 | —
XXL | 108–114 | 92–98 | —
3XL | 114–120 | 98–104 | —

نصيحة: لو بين مقاسين، اختَر الأكبر لراحة أكتر.
`.trim();

type Props = {
  productType?: string | null;
  customText?: string | null;
};

export function SizeGuide({ productType, customText }: Props) {
  const [open, setOpen] = useState(false);
  if (productType !== "clothing" && !customText) return null;

  const text = customText?.trim() || DEFAULT_CLOTHING;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm underline text-muted hover:text-ink"
      >
        دليل المقاسات
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-auto p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">دليل المقاسات</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-muted text-sm">
                إغلاق
              </button>
            </div>
            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-ink/90">
              {text}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
