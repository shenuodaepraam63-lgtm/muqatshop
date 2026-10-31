"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import {
  loadAccountIdentity,
  type AccountIdentity,
} from "@/lib/account-identity";
import { supabase } from "@/lib/supabase";
import { signOutEverywhere } from "@/lib/auth-session";

export default function AccountProfilePage() {
  const router = useRouter();
  const [identity, setIdentity] = useState<AccountIdentity | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [confirmOut, setConfirmOut] = useState(false);

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
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      })
      .eq("id", identity.userId);
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg("تم تحديث الملف الشخصي.");
  }

  async function logout() {
    await signOutEverywhere();
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[#718096]">
        جاري التحميل...
      </div>
    );
  }

  if (!identity) return null;

  const typeLabel =
    identity.accountType === "admin"
      ? "إدارة"
      : identity.accountType === "affiliate"
        ? "مسوق"
        : identity.accountType === "supplier"
          ? "تاجر"
          : "عميل";

  const statusLabel =
    identity.affiliateStatus || identity.supplierStatus || (identity.isActive ? "نشط" : "موقوف");

  const field =
    "w-full h-[50px] rounded-[10px] border border-[#E4E9F0] px-3 text-[15px] outline-none focus:border-[#3157D5]";

  return (
    <AuthShell
      title="الملف الشخصي"
      description="إدارة بيانات حسابك على Muqatshop."
      footer={
        <div className="space-y-2 text-center text-sm">
          <Link href="/forgot-password" className="block text-[#3157D5] font-semibold">
            تغيير كلمة المرور
          </Link>
          {!confirmOut ? (
            <button type="button" className="text-[#718096]" onClick={() => setConfirmOut(true)}>
              تسجيل الخروج
            </button>
          ) : (
            <div className="flex gap-2 justify-center">
              <button type="button" className="font-semibold text-[#D64C4C]" onClick={logout}>
                تأكيد الخروج
              </button>
              <button type="button" className="text-[#718096]" onClick={() => setConfirmOut(false)}>
                إلغاء
              </button>
            </div>
          )}
        </div>
      }
    >
      <div className="rounded-xl border border-[#E4E9F0] bg-[#F6F8FB] p-4 mb-4 text-sm space-y-2">
        <div className="flex justify-between gap-2">
          <span className="text-[#718096]">البريد</span>
          <span className="font-semibold dir-ltr">{identity.email}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-[#718096]">نوع الحساب</span>
          <span className="font-semibold">{typeLabel}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-[#718096]">الحالة</span>
          <span className="font-semibold">{statusLabel}</span>
        </div>
      </div>

      <form onSubmit={save} className="space-y-3">
        <div>
          <label className="block text-sm font-semibold mb-1">الاسم</label>
          <input className={field} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">رقم الهاتف</label>
          <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
        </div>
        {err ? <p className="text-sm text-[#D64C4C]">{err}</p> : null}
        {msg ? <p className="text-sm text-[#21865B]">{msg}</p> : null}
        <button type="submit" disabled={saving} className="w-full h-[50px] rounded-[10px] bg-[#3157D5] text-white font-semibold disabled:opacity-60">
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </form>

      <Link href="/account" className="mt-4 block text-center text-xs text-[#718096] hover:text-[#3157D5]">
        عنوان الشحن والطلبات (الحساب الحالي)
      </Link>
    </AuthShell>
  );
}
