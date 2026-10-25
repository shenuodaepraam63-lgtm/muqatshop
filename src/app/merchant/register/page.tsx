"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authRedirectTo, syncMerchantFromAuthUser } from "@/lib/auth-customer";

export default function MarketerRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (password.length < 6) {
      setError("كلمة المرور 6 أحرف على الأقل");
      return;
    }
    if (!name.trim()) {
      setError("الاسم مطلوب");
      return;
    }
    setLoading(true);
    const em = email.trim().toLowerCase();

    const { data: taken } = await supabase
      .from("merchants")
      .select("id, email_verified")
      .eq("email", em)
      .maybeSingle();

    if (taken?.email_verified) {
      setLoading(false);
      setError("البريد مسجّل كمسوق بالفعل — سجّل الدخول");
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email: em,
      password,
      options: {
        data: {
          name: name.trim(),
          phone: phone.trim() || null,
          role: "merchant",
        },
        emailRedirectTo: authRedirectTo(
          "/auth/callback?role=merchant&next=/merchant"
        ),
      },
    });

    if (err) {
      setLoading(false);
      setError(
        err.message.includes("already") || err.message.includes("registered")
          ? "البريد مستخدم في النظام — جرّب تسجيل الدخول أو استعادة كلمة المرور"
          : err.message
      );
      return;
    }

    if (data.session) {
      const synced = await syncMerchantFromAuthUser({
        name: name.trim(),
        phone: phone.trim() || null,
      });
      setLoading(false);
      if (!synced.ok) {
        setError(synced.error);
        return;
      }
      router.replace("/merchant");
      return;
    }

    setLoading(false);
    setInfo(
      "أرسلنا رابط تأكيد إلى بريدك. افتح الرسالة واضغط زر التأكيد لإكمال تسجيل المسوق."
    );
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-[#f7f5f0]">
      <form
        onSubmit={submit}
        className="bg-white border border-[#eae6df] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-sm"
      >
        <div>
          <p className="text-[11px] font-semibold text-[#0042EB] tracking-wide">
            بوابة المسوق
          </p>
          <h1 className="text-xl font-bold mt-1">إنشاء حساب مسوق</h1>
          <p className="text-sm text-muted mt-1">
            بعد التسجيل أكّد بريدك من خلال الرابط اللي هيوصلك على الإيميل.
          </p>
        </div>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="الاسم"
          className="w-full border rounded-xl px-4 py-3 text-sm"
        />
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
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="رقم التليفون"
          className="w-full border rounded-xl px-4 py-3 text-sm"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="كلمة المرور (6+ أحرف)"
          className="w-full border rounded-xl px-4 py-3 text-sm"
        />
        {error && <p className="text-sm text-sale">{error}</p>}
        {info && <p className="text-sm text-green-700 leading-relaxed">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-white py-3 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "..." : "إنشاء حساب وإرسال رابط التأكيد"}
        </button>
        <p className="text-xs text-center text-muted">
          لديك حساب؟{" "}
          <Link href="/merchant/login" className="underline font-medium text-ink">
            تسجيل الدخول
          </Link>
        </p>
        <p className="text-xs text-center">
          <Link href="/" className="text-muted hover:underline">
            العودة للمتجر العام
          </Link>
        </p>
      </form>
    </div>
  );
}
