"use client";

import type { ReactNode } from "react";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "blue" | "teal" | "success" | "warn";
};

const toneBg: Record<NonNullable<Props["tone"]>, string> = {
  default: "bg-[#EEF2F7] text-[#14243A]",
  blue: "bg-[#E8EEFB] text-[#3157D5]",
  teal: "bg-[#E6F7F4] text-[#18A999]",
  success: "bg-[#E8F5EF] text-[#21865B]",
  warn: "bg-[#FDECEC] text-[#D64C4C]",
};

export function StatCard({ label, value, hint, icon, tone = "default" }: Props) {
  return (
    <div className="rounded-2xl border border-[#E4E9F0] bg-white p-4 shadow-[0_1px_2px_rgba(20,36,58,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#718096]">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#202B3C]">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-[11px] leading-snug text-[#718096]">{hint}</p>
          ) : null}
        </div>
        {icon ? (
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${toneBg[tone]}`}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
