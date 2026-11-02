"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loadAccountIdentity,
  type AccountIdentity,
} from "@/lib/account-identity";
import { resolveCustomerId } from "@/lib/customer-account";
import { useLocale } from "@/lib/locale";
import { supabase } from "@/lib/supabase";

export default function AccountProfilePage() {
  const router = useRouter();
  const { t } = useLocale();
  const [identity, setIdentity] = useState<AccountIdentity | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await loadAccountIdentity();
      if (!res.ok) {
        router.replace("/login?next=/account/profile");
        return;
      }
      setIdentity(res.identity);
      setFullName(res.identity.fullName || "");
      setPhone(res.identity.phone || "");
      setLoading(false);
    })();
  }, [router]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!identity) return;
    setSaving(true);
    setErr(null);
    setMsg(null);
    const name = fullName.trim();
    const { error: pErr } = await supabase
      .from("profiles")
      .update({ full_name: name || null, phone: phone.trim() || null })
      .eq("id", identity.userId);
    if (pErr) {
      setSaving(false);
      setErr(pErr.message);
      return;
    }
    const customerId = await resolveCustomerId(identity);
    if (customerId) {
      await supabase
        .from("customers")
        .update({
          name: name || identity.email.split("@")[0],
          phone: phone.trim() || null,
        })
        .eq("id", customerId);
    }
    setSaving(false);
    setMsg(t("profile.save") === "Save" ? "Saved" : "تم حفظ بياناتك");
  }

  if (loading || !identity) {
    return <p className="text-sm text-[var(--text-muted)]">{t("loading")}</p>;
  }

  const field =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2.5 text-sm text-[var(--text)]";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[var(--text)]">{t("profile.title")}</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t("profile.subtitle")}</p>
      </div>

      <form onSubmit={save} className="account-card space-y-3 p-5">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">
            {t("settings.email")}
          </label>
          <input className={field} value={identity.email} disabled dir="ltr" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">
            {t("profile.title") === "Profile" ? "Name" : "الاسم"}
          </label>
          <input
            className={field}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">
            {t("profile.title") === "Profile" ? "Phone" : "الهاتف"}
          </label>
          <input
            className={field}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
          />
        </div>
        {err && <p className="text-sm text-[#D64C4C]">{err}</p>}
        {msg && <p className="text-sm text-[#21865B]">{msg}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#3157D5] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? t("profile.saving") : t("profile.save")}
        </button>
      </form>
    </div>
  );
}
