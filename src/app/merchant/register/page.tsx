"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { hashPassword, saveMerchantSession } from "@/lib/merchant";

export default function MerchantRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("كلمة المرور 6 أحرف على الأقل");
      return;
    }
    setLoading(true);
    const hash = await hashPassword(password);
    const { data, error: err } = await supabase
      .from("merchants")
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        password_hash: hash,
        is_active: true,
      })
      .select("id, email, name, phone, is_active")
      .single();

    if (err || !data) {
      setLoading(false);
      setError(err?.message?.includes("unique") ? "البريد مستخدم بالفعل" : err?.message || "فشل التسجيل");
      return;
    }

    await supabase.from("merchant_wallets").insert({
      merchant_id: data.id,
      balance: 0,
      pending: 0,
    });

    saveMerchantSession(data);
    setLoading(false);
    router.replace("/merchant");
  };

  return (
    <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center px-4">
      <form onSubmit={submit} className="bg-white border border-[#e8e2d9] rounded-2xl p-6 w-full max-w-md space-y-4">
        <h1 className="text-xl font-bold">تسجيل تاجر جديد</h1>
        <p className="text-sm text-muted">مفتوح للجميع — اطلب لعملائك بهامش ربحك</p>
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" className="w-full border rounded-xl px-4 py-3 text-sm" />
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد" className="w-full border rounded-xl px-4 py-3 text-sm" />
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="موبايل" className="w-full border rounded-xl px-4 py-3 text-sm" />
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full border rounded-xl px-4 py-3 text-sm" />
        {error && <p className="text-sm text-sale">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-ink text-white py-3 rounded-full text-sm font-semibold disabled:opacity-50">
          {loading ? "..." : "إنشاء الحساب"}
        </button>
        <p className="text-sm text-center text-muted">
          عندك حساب؟{" "}
          <Link href="/merchant/login" className="underline">
            دخول
          </Link>
        </p>
      </form>
    </div>
  );
}
