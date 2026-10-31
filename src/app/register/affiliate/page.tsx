"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { registerWithSupabaseAuth, validateRegisterBase } from "@/lib/register-account";

const CHANNELS = ["Facebook", "Instagram", "TikTok", "WhatsApp", "YouTube", "Website", "وسائل أخرى"];

export default function RegisterAffiliatePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [channels, setChannels] = useState<string[]>([]);
  const [marketingUrl, setMarketingUrl] = useState("");
  const [marketingDescription, setMarketingDescription] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleChannel(c: string) {
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!terms) {
      setError("يجب الموافقة على شروط برنامج التسويق بالعمولة وسياسة المنصة.");
      return;
    }
    if (channels.length === 0) {
      setError("اختر وسيلة تسويق واحدة على الأقل.");
      return;
    }

    const base = {
      fullName,
      email,
      phone,
      password,
      accountType: "affiliate" as const,
    };
    const v = validateRegisterBase(base, password2);
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      const res = await registerWithSupabaseAuth(base, {
        affiliate: {
          marketingChannels: channels,
          marketingUrl: marketingUrl.trim() || undefined,
          marketingDescription: marketingDescription.trim() || undefined,
        },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(
        res.needsEmailConfirm
          ? `/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&type=affiliate`
          : "/account/pending?type=affiliate"
      );
    } catch {
      setError("تعذر الاتصال بالخادم، حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full h-[50px] rounded-[10px] border border-[#E4E9F0] px-3 text-[15px] outline-none focus:border-[#3157D5]";

  return (
    <AuthShell
      title="انضم كمسوق"
      description="أرسل طلب الانضمام لبرنامج التسويق بالعمولة."
      brandingMessage="صلاحيات التسويق تُفعَّل بعد مراجعة واعتماد الإدارة."
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
          <input className={field} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="أدخل اسمك الكامل" required />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">البريد الإلكتروني</label>
          <input type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="أدخل بريدك الإلكتروني" required />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">رقم الهاتف</label>
          <input type="tel" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" required />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">كلمة المرور</label>
          <div className="relative">
            <input type={showPass ? "text" : "password"} className={`${field} pe-14`} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="أنشئ كلمة مرور قوية" required />
            <button type="button" className="absolute inset-y-0 end-0 px-3 text-xs font-semibold text-[#718096]" onClick={() => setShowPass((s) => !s)}>
              {showPass ? "إخفاء" : "إظهار"}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">تأكيد كلمة المرور</label>
          <input type={showPass ? "text" : "password"} className={field} value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="أعد إدخال كلمة المرور" required />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">أين تخطط لتسويق المنتجات؟</label>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((c) => {
              const on = channels.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleChannel(c)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                    on
                      ? "border-[#3157D5] bg-[#3157D5]/10 text-[#3157D5]"
                      : "border-[#E4E9F0] text-[#718096]"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">رابط حسابك أو صفحتك التسويقية</label>
          <input className={field} value={marketingUrl} onChange={(e) => setMarketingUrl(e.target.value)} placeholder="https://..." />
          <p className="mt-1 text-xs text-[#718096]">اختياري عند التسجيل الأولي</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">أخبرنا عن طريقة التسويق التي تستخدمها</label>
          <textarea
            value={marketingDescription}
            onChange={(e) => setMarketingDescription(e.target.value)}
            rows={3}
            className="w-full rounded-[10px] border border-[#E4E9F0] px-3 py-2 text-[15px] outline-none focus:border-[#3157D5]"
            placeholder="اختياري"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-[#718096] cursor-pointer">
          <input type="checkbox" className="mt-1" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>أوافق على شروط برنامج التسويق بالعمولة وسياسة المنصة.</span>
        </label>

        {error ? <p className="text-sm text-[#D64C4C]" role="alert">{error}</p> : null}

        <button type="submit" disabled={loading} className="w-full h-[50px] rounded-[10px] bg-[#3157D5] text-white font-semibold disabled:opacity-60">
          {loading ? "جاري الإرسال..." : "إرسال طلب الانضمام"}
        </button>
      </form>
    </AuthShell>
  );
}
