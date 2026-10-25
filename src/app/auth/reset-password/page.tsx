"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { syncCustomerFromAuthUser } from "@/lib/auth-customer";
import { BrandLogo } from "@/components/brand/BrandLogo";

/**
 * بعد فتح رابط Reset password من البريد،
 * المستخدم يصل هنا (مباشرة أو عبر /auth/callback?type=recovery)
 * ويعيّن كلمة مرور جديدة عبر updateUser.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      // معالجة hash إن وُجد على هذه الصفحة مباشرة
      if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        }
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("انتهت صلاحية الرابط أو غير صالح. اطلب رابط استعادة جديدًا.");
        setReady(true);
        return;
      }
      setReady(true);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (password.length < 6) {
      setError("كلمة المرور 6 أحرف على الأقل");
      return;
    }
    if (password !== password2) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    await syncCustomerFromAuthUser();
    setLoading(false);
    setInfo("تم تحديث كلمة المرور بنجاح");
    setTimeout(() => router.replace("/"), 1000);
  };

  const field =
    "w-full border border-[#e8e2d9] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ink/20 bg-white";

  return (
    <div className="min-h-screen bg-[#f8f5f0] flex flex-col items-center justify-center px-4">
      <BrandLogo size="md" className="mb-8" />
      <div className="w-full max-w-sm bg-white border border-[#e8e2d9] rounded-2xl p-6 space-y-4">
        <h1 className="text-lg font-bold text-center">تعيين كلمة مرور جديدة</h1>
        {!ready ? (
          <p className="text-sm text-muted text-center">جاري التحقق من الرابط...</p>
        ) : error && !info && !password ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-sale">{error}</p>
            <Link href="/welcome?tab=customer&mode=forgot" className="text-sm font-semibold underline">
              طلب رابط جديد
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور الجديدة"
              className={field}
            />
            <input
              type="password"
              required
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="تأكيد كلمة المرور"
              className={field}
            />
            {error && <p className="text-sm text-sale">{error}</p>}
            {info && <p className="text-sm text-green-700">{info}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-50"
            >
              {loading ? "..." : "حفظ كلمة المرور"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
