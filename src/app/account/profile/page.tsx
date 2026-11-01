"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  loadAccountIdentity,
  type AccountIdentity,
} from "@/lib/account-identity";
import { resolveCustomerId } from "@/lib/customer-account";
import { supabase } from "@/lib/supabase";

export default function AccountProfilePage() {
  const router = useRouter();
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
    setMsg("تم حفظ بياناتك");
  }

  if (loading || !identity) {
    return <p className="text-sm text-[#718096]">جاري التحميل...</p>;
  }

  const field = "w-full rounded-xl border border-[#E4E9F0] bg-white px-3 py-2.5 text-sm";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#14243A]">بياناتي الشخصية</h2>
        <p className="mt-1 text-sm text-[#718096]">تحديث الاسم ورقم الهاتف المرتبطين بالحساب.</p>
      </div>

      <form
        onSubmit={save}
        className="space-y-3 rounded-2xl border border-[#E4E9F0] bg-white p-5 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#718096]">البريد (لا يتغير)</label>
          <input className={field} value={identity.email} disabled dir="ltr" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#718096]">الاسم</label>
          <input className={field} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#718096]">الهاتف</label>
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
          className="rounded-xl bg-[#14243A] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "..." : "حفظ"}
        </button>
      </form>

      <p className="text-sm text-[#718096]">
        للأمان وكلمة المرور وتسجيل الخروج انتقل إلى{" "}
        <Link href="/account/settings" className="font-semibold text-[#3157D5]">
          إعدادات الحساب
        </Link>
        .
      </p>
    </div>
  );
}
