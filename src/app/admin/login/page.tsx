"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("muqatshop@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (err) {
      setError(err.message === "Invalid login credentials" ? "بيانات الدخول غير صحيحة" : err.message);
      setLoading(false);
      return;
    }

    if (data.user?.email !== "muqatshop@gmail.com") {
      await supabase.auth.signOut();
      setError("هذا الحساب غير مصرح له بالدخول");
      setLoading(false);
      return;
    }

    router.replace("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFCEE] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 border border-border">
        <div className="text-center mb-8">
          <BrandLogo size="md" className="mb-5" />
          <h1 className="text-2xl font-bold text-ink">لوحة التحكم</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
              required
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
              required
              dir="ltr"
            />
          </div>

          {error && (
            <div className="text-sm text-sale bg-sale/10 rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}
