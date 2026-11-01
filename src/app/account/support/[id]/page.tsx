"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

/** Placeholder route until support tickets table exists. */
export default function AccountSupportTicketPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="space-y-4">
      <Link href="/account/support" className="text-sm font-semibold text-[#3157D5]">
        ← الدعم
      </Link>
      <div className="rounded-2xl border border-[#E4E9F0] bg-white p-6 text-center shadow-sm">
        <p className="font-semibold text-[#14243A]">التذكرة غير متاحة</p>
        <p className="mt-2 text-sm text-[#718096]">
          المعرّف <span className="font-mono">{id}</span> — نظام التذاكر غير مفعّل في قاعدة
          البيانات حاليًا.
        </p>
        <a
          href="mailto:muqatshop@gmail.com"
          className="mt-4 inline-block text-sm font-bold text-[#3157D5]"
        >
          راسل الدعم عبر البريد
        </a>
      </div>
    </div>
  );
}
