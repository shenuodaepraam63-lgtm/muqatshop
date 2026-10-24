"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { hashPassword, saveMerchantSession } from "@/lib/merchant";

export default function MerchantLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const hash = await hashPassword(password);
    const { data, error: err } = await supabase
      .from("merchants")
      .select("id, email, name, phone, is_active")
      .eq("email", email.trim().toLowerCase())
      .eq("password_hash", hash)
      .maybeSingle();
    setLoading(false);
    if (err || !data) {
      setError("بيانات الدخول غير صحيحة");
      return;
    }
    if (!data.is_active) {
      setError("الحساب موقوف — تواصل مع الإدارة");
      return;
    }
    saveMerchantSession(data);
    router.replace("/shop");
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <form onSubmit={submit} className="bg-white border border-[#e8e2d9] rounded-2xl p-6 w-full max-w-md space-y-4">
        <h1 className="text-xl font-bold">دخول التاجر</h1>
        <p className="text-sm text-muted">
          بعد الدخول هتتصفح نفس المتجر — في السلة تقدر ترفع السعر والطلب يتسجل على حسابك
        </p>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد" className="w-full border rounded-xl px-4 py-3 text-sm" />
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full border rounded-xl px-4 py-3 text-sm" />
        {error && <p className="text-sm text-sale">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-ink text-white py-3 rounded-full text-sm font-semibold disabled:opacity-50">
          {loading ? "..." : "دخول للمتجر"}
        </button>
        <p className="text-sm text-center text-muted">
          مش تاجر؟{" "}
          <Link href="/merchant/register" className="text-ink underline">إنشاء حساب</Link>
        </p>
      </form>
    </div>
  );
}
