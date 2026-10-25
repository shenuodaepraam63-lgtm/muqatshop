"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  authRedirectTo,
  syncMerchantFromAuthUser,
} from "@/lib/auth-customer";
import { hashPassword, saveMerchantSession } from "@/lib/merchant";
import { clearCustomerSession } from "@/lib/customer";
import { setSiteRole } from "@/lib/role";

export default function MarketerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const enterAsMarketer = () => {
    // فصل تام: مسح جلسة العميل
    clearCustomerSession();
    setSiteRole("merchant");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    const em = email.trim().toLowerCase();

    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: em,
      password,
    });

    if (!authErr) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && !user.email_confirmed_at) {
        setLoading(false);
        setError("البريد غير مؤكد — افتح رابط التأكيد المرسل إلى بريدك");
        await supabase.auth.signOut();
        return;
      }
      const synced = await syncMerchantFromAuthUser();
      setLoading(false);
      if (!synced.ok) {
        setError(synced.error);
        return;
      }
      enterAsMarketer();
      router.replace("/merchant");
      return;
    }

    const hash = await hashPassword(password);
    const { data } = await supabase
      .from("merchants")
      .select("id, email, name, phone, is_active, code, email_verified")
      .eq("email", em)
      .eq("password_hash", hash)
      .maybeSingle();

    if (!data) {
      setLoading(false);
      setError(
        authErr.message?.toLowerCase().includes("email not confirmed")
          ? "البريد غير مؤكد — افتح رابط التأكيد في بريدك"
          : "بيانات الدخول غير صحيحة"
      );
      return;
    }

    if (!data.is_active) {
      setLoading(false);
      setError("الحساب موقوف");
      return;
    }

    if (data.email_verified === false) {
      setLoading(false);
      setError(
        "يجب تأكيد البريد أولًا. سجّل من جديد بنفس البريد أو تواصل مع الإدارة."
      );
      return;
    }

    saveMerchantSession({
      id: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
      code: data.code,
    });
    enterAsMarketer();
    setLoading(false);
    router.replace("/merchant");
  };

  const forgot = async () => {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("اكتب بريدك أولاً ثم اضغط نسيت كلمة المرور");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: authRedirectTo("/auth/reset-password") }
    );
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setInfo("إن وُجد حساب، ستصلك رسالة فيها رابط إعادة تعيين كلمة المرور.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-page">
      <form
        onSubmit={submit}
        className="bg-white border border-[#e8e2d9] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-sm"
      >
        <div>
          <p className="text-[11px] font-semibold text-accent tracking-wide">
            بوابة المسوق
          </p>
          <h1 className="text-xl font-bold mt-1">تسجيل الدخول</h1>
          <p className="text-xs text-muted mt-1">
            حساب المسوق منفصل تمامًا عن حساب العميل
          </p>
        </div>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="البريد الإلكتروني"
          className="w-full border border-[#e8e2d9] rounded-xl px-4 py-3 text-sm"
          dir="ltr"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="كلمة المرور"
          className="w-full border border-[#e8e2d9] rounded-xl px-4 py-3 text-sm"
        />
        {error && <p className="text-sm text-sale">{error}</p>}
        {info && <p className="text-sm text-muted">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-white py-3 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "..." : "دخول كمسوق"}
        </button>
        <button
          type="button"
          onClick={forgot}
          className="w-full text-xs text-muted underline"
          disabled={loading}
        >
          نسيت كلمة المرور؟
        </button>
        <p className="text-xs text-center text-muted">
          مسوق جديد؟{" "}
          <Link
            href="/merchant/register"
            className="underline font-medium text-ink"
          >
            إنشاء حساب مسوق
          </Link>
        </p>
        <p className="text-xs text-center text-muted border-t border-[#f0ebe3] pt-3">
          عميل؟{" "}
          <Link href="/welcome?tab=customer" className="underline">
            دخول العملاء من هنا
          </Link>
        </p>
      </form>
    </div>
  );
}
