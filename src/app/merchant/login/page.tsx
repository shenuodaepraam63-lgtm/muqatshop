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
import { setSiteRole } from "@/lib/role";

export default function MerchantLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    const em = email.trim().toLowerCase();

    // 1) محاولة Supabase Auth (تجار مؤكدون بالرابط)
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
      router.replace("/merchant");
      return;
    }

    // 2) توافق قديم: تجار بـ password_hash فقط (قبل تأكيد البريد)
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

    // إن كان غير مؤكد بالإيميل الجديد — نطلب إعادة إرسال رابط عبر Auth إن أمكن
    if (data.email_verified === false) {
      setLoading(false);
      setError("يجب تأكيد البريد أولًا. سجّل من جديد بنفس البريد أو تواصل مع الإدارة.");
      return;
    }

    saveMerchantSession({
      id: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
      code: data.code,
    });
    setSiteRole("merchant");
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
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <form
        onSubmit={submit}
        className="bg-white border border-[#e8e2d9] rounded-2xl p-6 w-full max-w-md space-y-4"
      >
        <h1 className="text-xl font-bold">دخول تاجر</h1>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="البريد الإلكتروني"
          className="w-full border rounded-xl px-4 py-3 text-sm"
          dir="ltr"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="كلمة المرور"
          className="w-full border rounded-xl px-4 py-3 text-sm"
        />
        {error && <p className="text-sm text-sale">{error}</p>}
        {info && <p className="text-sm text-muted">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-white py-3 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "..." : "دخول"}
        </button>
        <button
          type="button"
          onClick={forgot}
          className="w-full text-xs text-muted underline"
          disabled={loading}
        >
          نسيت كلمة المرور؟ (رابط على البريد)
        </button>
        <p className="text-xs text-center text-muted">
          تاجر جديد؟{" "}
          <Link href="/merchant/register" className="underline font-medium text-ink">
            إنشاء حساب وتأكيد البريد
          </Link>
        </p>
      </form>
    </div>
  );
}
