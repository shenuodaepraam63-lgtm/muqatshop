"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { registerWithSupabaseAuth, validateRegisterBase } from "@/lib/register-account";

function strengthLabel(pw: string): { level: "weak" | "medium" | "strong"; text: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { level: "weak", text: "ضعيفة" };
  if (score <= 4) return { level: "medium", text: "متوسطة" };
  return { level: "strong", text: "قوية" };
}

export default function RegisterCustomerPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = useMemo(() => strengthLabel(password), [password]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!terms) {
      setError("يجب الموافقة على الشروط وسياسة الخصوصية.");
      return;
    }

    const base = {
      fullName,
      email,
      phone,
      password,
      accountType: "customer" as const,
    };
    const v = validateRegisterBase(base, password2);
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      const res = await registerWithSupabaseAuth(base);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Email confirmation link only — no OTP screen
      router.push(
        res.needsEmailConfirm
          ? `/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&type=customer`
          : "/account"
      );
    } catch {
      setError("تعذر الاتصال بالخادم، حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full h-[50px] rounded-[10px] border border-[#E4E9F0] px-3 text-[15px] outline-none focus:border-[#3157D5] transition-colors";

  return (
    <AuthShell
      title="إنشاء حساب عميل"
      description="أنشئ حسابك للتسوق من Muqatshop ومتابعة طلباتك."
      brandingMessage="تجربة شراء منظمة — حساب واحد وهوية موحدة."
      footer={
        <p className="text-center text-sm text-[#718096]">
          <Link href="/register" className="hover:text-[#3157D5]">
            تغيير نوع الحساب
          </Link>
          {" · "}
          <Link href="/login" className="font-semibold text-[#3157D5] hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3" noValidate>
        <div>
          <label className="block text-sm font-semibold mb-1">الاسم الكامل</label>
          <input
            className={field}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="أدخل اسمك الكامل"
            autoComplete="name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">البريد الإلكتروني</label>
          <input
            type="email"
            inputMode="email"
            className={field}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="أدخل بريدك الإلكتروني"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">رقم الهاتف</label>
          <input
            type="tel"
            inputMode="numeric"
            className={field}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            autoComplete="tel"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">كلمة المرور</label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              className={`${field} pe-14`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أنشئ كلمة مرور قوية"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 end-0 px-3 text-xs font-semibold text-[#718096]"
              onClick={() => setShowPass((s) => !s)}
            >
              {showPass ? "إخفاء" : "إظهار"}
            </button>
          </div>
          {password ? (
            <p
              className={`mt-1 text-xs font-semibold ${
                strength.level === "weak"
                  ? "text-[#D64C4C]"
                  : strength.level === "medium"
                    ? "text-amber-600"
                    : "text-[#21865B]"
              }`}
            >
              قوة كلمة المرور: {strength.text}
              {password.length < 12 ? " — يُفضّل 12 حرفًا أو أكثر" : ""}
            </p>
          ) : (
            <p className="mt-1 text-xs text-[#718096]">8 أحرف على الأقل، ويُفضّل 12 حرفًا.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">تأكيد كلمة المرور</label>
          <input
            type={showPass ? "text" : "password"}
            className={field}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="أعد إدخال كلمة المرور"
            autoComplete="new-password"
            required
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-[#718096] cursor-pointer">
          <input
            type="checkbox"
            className="mt-1"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
          />
          <span>أوافق على الشروط وسياسة الخصوصية.</span>
        </label>

        {error ? (
          <p className="text-sm text-[#D64C4C]" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[50px] rounded-[10px] bg-[#3157D5] text-white font-semibold disabled:opacity-60"
        >
          {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
        </button>
      </form>
    </AuthShell>
  );
}
