"use client";

import { useEffect, useState } from "react";

type Parts = { d: number; h: number; m: number; s: number } | null;

function calc(endsAt: string): Parts {
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) return null;
  const diff = end - Date.now();
  if (diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

function Cell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[52px] bg-ink text-page rounded-xl px-2 py-2">
      <span className="text-lg font-bold tabular-nums leading-none">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] opacity-80 mt-1">{label}</span>
    </div>
  );
}

export function SaleCountdown({ endsAt }: { endsAt: string }) {
  const [parts, setParts] = useState<Parts>(() => calc(endsAt));

  useEffect(() => {
    setParts(calc(endsAt));
    const t = setInterval(() => setParts(calc(endsAt)), 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  if (!parts) return null;

  return (
    <div className="mb-5 rounded-2xl border border-[#e8e2d9] bg-[#f8f5f0] p-4">
      <p className="text-xs font-semibold text-sale mb-3 tracking-wide">
        ⏱ العرض ينتهي خلال
      </p>
      <div className="flex items-center gap-2 justify-start flex-wrap">
        {parts.d > 0 && <Cell value={parts.d} label="يوم" />}
        <Cell value={parts.h} label="ساعة" />
        <Cell value={parts.m} label="دقيقة" />
        <Cell value={parts.s} label="ثانية" />
      </div>
    </div>
  );
}
