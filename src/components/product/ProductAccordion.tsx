"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

type Item = {
  title: string;
  content: React.ReactNode;
};

export function ProductAccordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(null);

  if (!items.length) return null;

  return (
    <div className="border-t border-[#e8e2d9] mt-8">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.title} className="border-b border-[#e8e2d9]">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between py-4 text-sm font-medium text-ink"
            >
              <span>{item.title}</span>
              {isOpen ? (
                <Minus className="w-4 h-4 shrink-0" />
              ) : (
                <Plus className="w-4 h-4 shrink-0" />
              )}
            </button>
            {isOpen && (
              <div className="pb-4 text-sm text-muted leading-relaxed whitespace-pre-line">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
