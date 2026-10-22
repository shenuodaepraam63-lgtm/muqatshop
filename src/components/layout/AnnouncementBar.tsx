"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const FALLBACK = [
  "🚚 شحن مجاني للطلبات فوق 600 جنيه",
  "Your Style. Your Choice.",
  "✨ توصيل لكل محافظات مصر",
];

export function AnnouncementBar() {
  const [messages, setMessages] = useState<string[]>(FALLBACK);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "announcement")
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.value) return;
        const v = data.value as {
          enabled?: boolean;
          text?: string;
          messages?: string[];
        };
        if (typeof v.enabled === "boolean") setEnabled(v.enabled);
        if (Array.isArray(v.messages) && v.messages.length) {
          setMessages(v.messages.filter(Boolean));
        } else if (typeof v.text === "string" && v.text.trim()) {
          setMessages(
            v.text
              .split(/[|·\n]/)
              .map((s) => s.trim())
              .filter(Boolean)
          );
        }
      });
  }, []);

  if (!enabled || messages.length === 0) return null;

  const doubled = [...messages, ...messages];

  return (
    <div
      className="announcement-bar bg-ink text-page text-sm h-[37px] overflow-hidden flex items-center"
      role="region"
      aria-label="إعلان"
    >
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((msg, i) => (
          <span key={i} className="mx-8 font-medium">
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}
