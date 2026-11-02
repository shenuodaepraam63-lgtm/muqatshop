"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, LifeBuoy, MessageCircle } from "lucide-react";
import { loadAccountIdentity } from "@/lib/account-identity";
import { useLocale } from "@/lib/locale";
import {
  SUPPORT_EMAIL,
  SUPPORT_WHATSAPP_DISPLAY,
  buildSupportWhatsAppUrl,
} from "@/lib/support-contact";

const TOPICS_AR = [
  { id: "order", label: "استفسار عن طلب" },
  { id: "account", label: "مشكلة في الحساب" },
  { id: "shipping", label: "الشحن والتوصيل" },
  { id: "return", label: "إرجاع أو استبدال" },
  { id: "other", label: "موضوع آخر" },
] as const;

const TOPICS_EN = [
  { id: "order", label: "Order inquiry" },
  { id: "account", label: "Account issue" },
  { id: "shipping", label: "Shipping" },
  { id: "return", label: "Return / exchange" },
  { id: "other", label: "Other" },
] as const;

export default function AccountSupportPage() {
  const { t, locale } = useLocale();
  const topics = locale === "en" ? TOPICS_EN : TOPICS_AR;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState<string>(topics[0].label);
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    setTopic(topics[0].label);
  }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    (async () => {
      const res = await loadAccountIdentity();
      if (!res.ok) return;
      setName(res.identity.fullName || "");
      setEmail(res.identity.email || "");
      setPhone(res.identity.phone || "");
    })();
  }, []);

  const waUrl = useMemo(
    () =>
      buildSupportWhatsAppUrl({
        fullName: name,
        email,
        phone,
        topic,
        orderNumber: orderNumber.trim() || null,
      }),
    [name, email, phone, topic, orderNumber]
  );

  const field =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2.5 text-sm text-[var(--text)]";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[var(--text)]">{t("support.title")}</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t("support.subtitle")}</p>
      </div>

      <section className="account-card border-[#18A999]/35 bg-gradient-to-b from-[#EFF8F6] to-[var(--card-bg)] p-5 dark:from-[#0f2a26] sm:p-6">
        <div className="flex items-start gap-3">
          <span className="inline-grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#18A999] text-white">
            <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[var(--text)]">WhatsApp</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]" dir="ltr">
              {SUPPORT_WHATSAPP_DISPLAY}
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#18A999] px-4 py-2.5 text-sm font-bold text-white"
            >
              WhatsApp
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="account-card space-y-3 p-5">
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          {locale === "en" ? "Topic" : "الموضوع"}
        </label>
        <select
          className={field}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          {topics.map((tp) => (
            <option key={tp.id} value={tp.label}>
              {tp.label}
            </option>
          ))}
        </select>
        <label className="block text-xs font-semibold text-[var(--text-muted)]">
          {locale === "en" ? "Order number (optional)" : "رقم الطلب (اختياري)"}
        </label>
        <input
          className={field}
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          dir="ltr"
        />
      </section>

      <section className="account-card p-5">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <LifeBuoy className="h-4 w-4" />
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-[#3157D5]" dir="ltr">
            {SUPPORT_EMAIL}
          </a>
        </div>
        <Link href="/account/orders" className="mt-3 inline-block text-sm font-bold text-[#3157D5]">
          {t("nav.orders")}
        </Link>
      </section>
    </div>
  );
}
