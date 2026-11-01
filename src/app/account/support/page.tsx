"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LifeBuoy, MessageCircle, ExternalLink } from "lucide-react";
import { loadAccountIdentity } from "@/lib/account-identity";
import {
  SUPPORT_EMAIL,
  SUPPORT_WHATSAPP_DISPLAY,
  buildSupportWhatsAppUrl,
} from "@/lib/support-contact";

const TOPICS = [
  { id: "order", label: "استفسار عن طلب" },
  { id: "account", label: "مشكلة في الحساب" },
  { id: "shipping", label: "الشحن والتوصيل" },
  { id: "return", label: "إرجاع أو استبدال" },
  { id: "other", label: "موضوع آخر" },
] as const;

/**
 * Real-time support via WhatsApp (primary) + email.
 * In-app tickets are not backed by DB yet — no fake ticket list.
 */
export default function AccountSupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState<string>(TOPICS[0].label);
  const [orderNumber, setOrderNumber] = useState("");

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

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#14243A]">الدعم والمساعدة</h2>
        <p className="mt-1 text-sm text-[#718096]">
          تواصل فوري عبر واتساب — هتفتح المحادثة مباشرة مع فريق Muqatshop.
        </p>
      </div>

      {/* Primary real-time channel */}
      <section className="rounded-2xl border border-[#18A999]/35 bg-gradient-to-b from-[#EFF8F6] to-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="inline-grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#18A999] text-white">
            <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#14243A]">واتساب — رد في الوقت الفعلي</p>
            <p className="mt-1 text-sm text-[#526174]" dir="ltr">
              {SUPPORT_WHATSAPP_DISPLAY}
            </p>
            <p className="mt-2 text-xs leading-6 text-[#718096]">
              اضغط الزر لفتح واتساب فورًا برسالة جاهزة فيها بيانات حسابك. كمّل تفاصيل المشكلة
              في المحادثة.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#718096]">موضوع المساعدة</label>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((t) => {
                const on = topic === t.label;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTopic(t.label)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      on
                        ? "border-[#18A999] bg-[#18A999] text-white"
                        : "border-[#E4E9F0] bg-white text-[#526174] hover:border-[#18A999]/50"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#718096]">
              رقم الطلب (اختياري)
            </label>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="مثال: MQ-XXXX"
              className="w-full rounded-xl border border-[#E4E9F0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#18A999]"
              dir="ltr"
            />
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#18A999] text-[15px] font-semibold text-white transition hover:bg-[#149486]"
          >
            <MessageCircle className="h-5 w-5" />
            فتح محادثة واتساب الآن
            <ExternalLink className="h-4 w-4 opacity-80" />
          </a>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm transition hover:border-[#18A999]/40"
        >
          <span className="inline-grid h-10 w-10 place-items-center rounded-lg bg-[#EFF8F6] text-[#18A999]">
            <MessageCircle className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-bold text-[#14243A]">واتساب مباشر</p>
          <p className="mt-1 text-xs text-[#718096]" dir="ltr">
            {SUPPORT_WHATSAPP_DISPLAY}
          </p>
        </a>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm transition hover:border-[#C8D6FF]"
        >
          <span className="inline-grid h-10 w-10 place-items-center rounded-lg bg-[#EEF3FF] text-[#3157D5]">
            <LifeBuoy className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-bold text-[#14243A]">البريد</p>
          <p className="mt-1 text-xs text-[#718096]" dir="ltr">
            {SUPPORT_EMAIL}
          </p>
        </a>
      </div>

      <div className="rounded-2xl border border-dashed border-[#D6DDEA] bg-white p-5">
        <p className="text-sm font-semibold text-[#14243A]">تذاكر داخل الموقع</p>
        <p className="mt-2 text-sm leading-7 text-[#718096]">
          نظام التذاكر داخل الحساب غير مفعّل في قاعدة البيانات بعد. القناة الفورية المعتمدة
          حاليًا هي واتساب على الرقم أعلاه.
        </p>
        <Link href="/account/orders" className="mt-3 inline-block text-sm font-bold text-[#3157D5]">
          مراجعة الطلبات
        </Link>
      </div>
    </div>
  );
}
