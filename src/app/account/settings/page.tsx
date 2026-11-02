"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadAccountIdentity, type AccountIdentity } from "@/lib/account-identity";
import { signOutToHome } from "@/lib/auth-session";
import { useLocale } from "@/lib/locale";
import {
  SUPPORT_WHATSAPP_DISPLAY,
  buildSupportWhatsAppUrl,
} from "@/lib/support-contact";

export default function AccountSettingsPage() {
  const { t } = useLocale();
  const [identity, setIdentity] = useState<AccountIdentity | null>(null);

  useEffect(() => {
    (async () => {
      const res = await loadAccountIdentity();
      if (res.ok) setIdentity(res.identity);
    })();
  }, []);

  const waUrl = useMemo(
    () =>
      buildSupportWhatsAppUrl({
        fullName: identity?.fullName,
        email: identity?.email,
        phone: identity?.phone,
        topic: "طلب حذف حساب / إعدادات",
      }),
    [identity]
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[var(--text)]">{t("settings.title")}</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t("settings.subtitle")}</p>
      </div>

      <section className="account-card space-y-4 p-5">
        <h3 className="text-sm font-bold text-[var(--text)]">{t("settings.account")}</h3>
        <div className="space-y-1 text-sm text-[var(--text-muted)]">
          <p>
            {t("settings.email")}:{" "}
            <span className="font-semibold text-[var(--text)]" dir="ltr">
              {identity?.email || "—"}
            </span>
          </p>
          <p>
            {t("settings.type")}:{" "}
            <span className="font-semibold text-[var(--text)]">
              {identity?.accountType || "customer"}
            </span>
          </p>
        </div>
        <Link href="/account/profile" className="text-sm font-bold text-[#3157D5]">
          {t("nav.profile")}
        </Link>
      </section>

      <section className="account-card space-y-3 p-5">
        <h3 className="text-sm font-bold text-[var(--text)]">{t("settings.session")}</h3>
        <button
          type="button"
          onClick={() => void signOutToHome()}
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-[#D64C4C] dark:border-red-900 dark:bg-red-950/40"
        >
          {t("settings.logout")}
        </button>
      </section>

      <section className="account-card space-y-3 p-5">
        <h3 className="text-sm font-bold text-[var(--text)]">{t("nav.support")}</h3>
        <p className="text-sm text-[var(--text-muted)]">
          WhatsApp:{" "}
          <span className="font-semibold text-[var(--text)]" dir="ltr">
            {SUPPORT_WHATSAPP_DISPLAY}
          </span>
        </p>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-sm font-bold text-[#18A999]"
        >
          WhatsApp
        </a>
      </section>
    </div>
  );
}
