"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { setSiteRole } from "@/lib/role";
import {
  hashPassword,
  saveCustomerSession,
  createAndStoreOtp,
  verifyOtp,
  getCustomerSession,
  sendCustomerMail,
} from "@/lib/customer";
import { supabase } from "@/lib/supabase";
import { getMerchantSession } from "@/lib/merchant";

type Tab = "guest" | "customer" | "merchant";
type CustMode = "login" | "register" | "otp" | "forgot" | "forgot_otp";

function WelcomeInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) || "customer");
  const [custMode, setCustMode] = useState<CustMode>(
    sp.get("mode") === "forgot" ? "forgot" : "login"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpPurpose, setOtpPurpose] = useState<"register" | "reset">("register");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getMerchantSession()) {
      setSiteRole("merchant");
      router.replace(next.startsWith("/") ? next : "/");
      return;
    }
    if (getCustomerSession()) {
      setSiteRole("customer");
      router.replace(next.startsWith("/") ? next : "/");
    }
  }, [router, next]);

  const goGuest = () => {
    setSiteRole("guest");
    router.replace("/");
  };

  const register = async (e: React.FormEvent) => {
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
    const hash = await hashPassword(password);

    const { data: existing } = await supabase
      .from("customers")
      .select("id, email_verified")
      .eq("email", em)
      .maybeSingle();

    if (existing?.email_verified) {
      setLoading(false);
      setError("البريد مسجّل بالفعل — سجّل الدخول");
      return;
    }

    if (existing && !existing.email_verified) {
      await supabase
        .from("customers")
        .update({ password_hash: hash, name: name.trim() })
        .eq("id", existing.id);
    } else {
      const { error: insErr } = await supabase.from("customers").insert({
        email: em,
        password_hash: hash,
        name: name.trim(),
        email_verified: false,
        is_active: true,
      });
      if (insErr) {
        setLoading(false);
        setError(insErr.message.includes("unique") ? "البريد مستخدم" : insErr.message);
        return;
      }
    }

    const code = await createAndStoreOtp(em, "register");
    const mail = await sendCustomerMail({
      email: em,
      name: name.trim(),
      code,
      purpose: "register",
    });
    if (!mail.ok) {
      setLoading(false);
      setError(mail.error || "تعذر إرسال رمز التحقق");
      return;
    }

    setPendingEmail(em);
    setOtpPurpose("register");
    setOtp("");
    setCustMode("otp");
    setInfo("أرسلنا رمز تحقق إلى بريدك. أدخله لإتمام التسجيل.");
    setLoading(false);
  };

  const confirmRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const em = pendingEmail || email.trim().toLowerCase();
    const res = await verifyOtp(em, otp, "register");
    if (!res.ok) {
      setLoading(false);
      setError(res.error);
      return;
    }

    await supabase.from("customers").update({ email_verified: true }).eq("email", em);

    const { data: cust } = await supabase
      .from("customers")
      .select("id, email, name, phone")
      .eq("email", em)
      .maybeSingle();

    if (!cust) {
      setLoading(false);
      setError("تعذر العثور على الحساب");
      return;
    }

    saveCustomerSession({
      id: cust.id,
      email: cust.email,
      name: cust.name,
      phone: cust.phone,
    });
    setSiteRole("customer");
    setLoading(false);
    router.replace(next.startsWith("/") ? next : "/");
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const em = email.trim().toLowerCase();
    const hash = await hashPassword(password);
    const { data, error: err } = await supabase
      .from("customers")
      .select("id, email, name, phone, is_active, email_verified, password_hash")
      .eq("email", em)
      .eq("password_hash", hash)
      .maybeSingle();

    if (err || !data) {
      setLoading(false);
      setError("بيانات الدخول غير صحيحة");
      return;
    }
    if (!data.is_active) {
      setLoading(false);
      setError("الحساب موقوف");
      return;
    }
    if (!data.email_verified) {
      const code = await createAndStoreOtp(em, "register");
      const mail = await sendCustomerMail({
        email: em,
        name: data.name,
        code,
        purpose: "register",
      });
      setLoading(false);
      if (!mail.ok) {
        setError(mail.error || "تعذر إرسال رمز التحقق");
        return;
      }
      setPendingEmail(em);
      setOtpPurpose("register");
      setOtp("");
      setCustMode("otp");
      setInfo("حسابك غير مفعّل — أدخل رمز التحقق المرسل لبريدك");
      return;
    }

    saveCustomerSession({
      id: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
    });
    setSiteRole("customer");
    setLoading(false);
    router.replace(next.startsWith("/") ? next : "/");
  };

  const startForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    const em = email.trim().toLowerCase();
    const { data } = await supabase
      .from("customers")
      .select("id, name, email_verified")
      .eq("email", em)
      .maybeSingle();

    if (!data || !data.email_verified) {
      setLoading(false);
      // لا نكشف إن الإيميل موجود أم لا بشكل صريح قدر الإمكان
      setError("إذا كان الحساب موجودًا سنرسل رمز التحقق للبريد");
      if (!data) {
        setLoading(false);
        return;
      }
    }

    const code = await createAndStoreOtp(em, "reset");
    const mail = await sendCustomerMail({
      email: em,
      name: data?.name || "عميل",
      code,
      purpose: "reset",
    });
    setLoading(false);
    if (!mail.ok) {
      setError(mail.error || "تعذر إرسال رمز التحقق");
      return;
    }
    setPendingEmail(em);
    setOtpPurpose("reset");
    setOtp("");
    setNewPassword("");
    setCustMode("forgot_otp");
    setInfo("أرسلنا رمز تحقق إلى بريدك. أدخله مع كلمة المرور الجديدة.");
  };

  const confirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("كلمة المرور الجديدة 6 أحرف على الأقل");
      return;
    }
    setLoading(true);
    const em = pendingEmail || email.trim().toLowerCase();
    const res = await verifyOtp(em, otp, "reset");
    if (!res.ok) {
      setLoading(false);
      setError(res.error);
      return;
    }

    const hash = await hashPassword(newPassword);
    const { data: cust, error: upErr } = await supabase
      .from("customers")
      .update({ password_hash: hash })
      .eq("email", em)
      .select("id, name, email")
      .maybeSingle();

    if (upErr || !cust) {
      setLoading(false);
      setError(upErr?.message || "تعذر تحديث كلمة المرور");
      return;
    }

    await sendCustomerMail({
      email: em,
      name: cust.name,
      purpose: "notice_password",
    });

    setLoading(false);
    setInfo("تم تغيير كلمة المرور. سجّل الدخول الآن.");
    setPassword("");
    setNewPassword("");
    setOtp("");
    setCustMode("login");
  };

  const field =
    "w-full border border-[#e8e2d9] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ink/20 bg-white";

  return (
    <div className="min-h-screen bg-[#f8f5f0] flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <BrandLogo size="md" />
      </div>

      <div className="w-full max-w-md bg-white border border-[#e8e2d9] rounded-3xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-3 border-b border-[#e8e2d9]">
          {(
            [
              { id: "guest" as Tab, label: "زائر" },
              { id: "customer" as Tab, label: "عميل" },
              { id: "merchant" as Tab, label: "تاجر" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setError("");
                setInfo("");
              }}
              className={`py-3.5 text-sm font-semibold transition ${
                tab === t.id ? "bg-ink text-white" : "bg-[#faf8f5] text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {tab === "guest" && (
            <>
              <h1 className="text-lg font-bold text-center">تصفح كزائر</h1>
              <p className="text-sm text-muted text-center leading-relaxed">
                تشوف المنتجات والأسعار عادي. للشراء أو السلة هتحتاج تسجّل كعميل.
              </p>
              <button type="button" onClick={goGuest} className="w-full bg-ink text-white py-3.5 rounded-full text-sm font-semibold">
                دخول كزائر
              </button>
            </>
          )}

          {tab === "customer" && (
            <>
              <h1 className="text-lg font-bold text-center">
                {custMode === "otp"
                  ? "تأكيد البريد"
                  : custMode === "forgot" || custMode === "forgot_otp"
                    ? "استعادة كلمة المرور"
                    : custMode === "register"
                      ? "إنشاء حساب عميل"
                      : "دخول عميل"}
              </h1>

              {(custMode === "login" || custMode === "register") && (
                <div className="flex rounded-full bg-[#f0ebe3] p-1 text-sm">
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-full ${custMode === "login" ? "bg-white font-semibold shadow-sm" : ""}`}
                    onClick={() => setCustMode("login")}
                  >
                    دخول
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-full ${custMode === "register" ? "bg-white font-semibold shadow-sm" : ""}`}
                    onClick={() => setCustMode("register")}
                  >
                    حساب جديد
                  </button>
                </div>
              )}

              {custMode === "login" && (
                <form onSubmit={login} className="space-y-3">
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className={field} />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className={field} />
                  {error && <p className="text-sm text-sale">{error}</p>}
                  {info && <p className="text-sm text-muted">{info}</p>}
                  <button type="submit" disabled={loading} className="w-full bg-ink text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-50">
                    {loading ? "..." : "دخول"}
                  </button>
                  <button type="button" className="w-full text-xs text-muted underline" onClick={() => { setCustMode("forgot"); setError(""); setInfo(""); }}>
                    نسيت كلمة المرور؟
                  </button>
                </form>
              )}

              {custMode === "register" && (
                <form onSubmit={register} className="space-y-3">
                  <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الكامل" className={field} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className={field} />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور (6+ أحرف)" className={field} />
                  {error && <p className="text-sm text-sale">{error}</p>}
                  {info && <p className="text-sm text-muted">{info}</p>}
                  <button type="submit" disabled={loading} className="w-full bg-ink text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-50">
                    {loading ? "..." : "إنشاء وإرسال رمز التحقق"}
                  </button>
                </form>
              )}

              {custMode === "forgot" && (
                <form onSubmit={startForgot} className="space-y-3">
                  <p className="text-sm text-muted text-center">سنرسل <strong>رمز تحقق</strong> إلى بريدك (وليس رابطًا).</p>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className={field} />
                  {error && <p className="text-sm text-sale">{error}</p>}
                  {info && <p className="text-sm text-muted">{info}</p>}
                  <button type="submit" disabled={loading} className="w-full bg-ink text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-50">
                    {loading ? "..." : "إرسال رمز التحقق"}
                  </button>
                  <button type="button" className="w-full text-xs text-muted" onClick={() => setCustMode("login")}>
                    العودة لتسجيل الدخول
                  </button>
                </form>
              )}

              {custMode === "forgot_otp" && (
                <form onSubmit={confirmReset} className="space-y-3">
                  <p className="text-sm text-muted text-center">
                    أدخل الرمز المرسل إلى <strong dir="ltr">{pendingEmail}</strong>
                  </p>
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className={`${field} text-center text-xl tracking-[0.4em] font-mono`}
                    dir="ltr"
                  />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="كلمة المرور الجديدة"
                    className={field}
                  />
                  {error && <p className="text-sm text-sale">{error}</p>}
                  {info && <p className="text-sm text-muted">{info}</p>}
                  <button type="submit" disabled={loading || otp.length < 6} className="w-full bg-ink text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-50">
                    {loading ? "..." : "تأكيد وتغيير كلمة المرور"}
                  </button>
                </form>
              )}

              {custMode === "otp" && (
                <form onSubmit={confirmRegisterOtp} className="space-y-3">
                  <p className="text-sm text-muted text-center">
                    أدخل <strong>رمز التحقق</strong> المرسل إلى <strong dir="ltr">{pendingEmail}</strong>
                  </p>
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className={`${field} text-center text-xl tracking-[0.4em] font-mono`}
                    dir="ltr"
                  />
                  {error && <p className="text-sm text-sale">{error}</p>}
                  {info && <p className="text-sm text-muted">{info}</p>}
                  <button type="submit" disabled={loading || otp.length < 6} className="w-full bg-ink text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-50">
                    {loading ? "..." : "تأكيد"}
                  </button>
                  <button
                    type="button"
                    className="w-full text-xs text-muted"
                    onClick={async () => {
                      setError("");
                      const em = pendingEmail || email;
                      const code = await createAndStoreOtp(em, otpPurpose);
                      const mail = await sendCustomerMail({
                        email: em,
                        name: name || "عميل",
                        code,
                        purpose: otpPurpose,
                      });
                      if (!mail.ok) setError(mail.error || "فشل إعادة الإرسال");
                      else setInfo("تم إرسال رمز جديد إلى بريدك");
                    }}
                  >
                    إعادة إرسال الرمز
                  </button>
                </form>
              )}
            </>
          )}

          {tab === "merchant" && (
            <>
              <h1 className="text-lg font-bold text-center">حساب تاجر</h1>
              <a href="/merchant/login" className="block w-full text-center bg-ink text-white py-3.5 rounded-full text-sm font-semibold">
                دخول تاجر
              </a>
              <p className="text-xs text-muted text-center">
                العميل يقدّم طلب تاجر من صفحة <strong>حسابي</strong> بعد تسجيل الدخول.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted text-sm">...</div>}>
      <WelcomeInner />
    </Suspense>
  );
}
