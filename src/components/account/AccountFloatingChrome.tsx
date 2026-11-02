"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUp, MessageCircle } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { supportWhatsAppHrefPlain } from "@/lib/support-contact";

export function AccountFloatingChrome() {
  const { t } = useLocale();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed bottom-5 end-4 z-40 flex flex-col items-end gap-2">
      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] shadow-md"
          aria-label={t("backTop")}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
      <a
        href={supportWhatsAppHrefPlain()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-[#18A999] px-3 py-2.5 text-xs font-bold text-white shadow-lg"
      >
        <MessageCircle className="h-4 w-4" />
        {t("support.float")}
      </a>
      <Link href="/account/support" className="sr-only">
        {t("nav.support")}
      </Link>
    </div>
  );
}
