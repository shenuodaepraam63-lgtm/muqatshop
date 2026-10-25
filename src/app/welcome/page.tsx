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
} from "@/lib/customer";
import { supabase } from "@/lib/supabase";
import { getMerchantSession } from "@/lib/merchant";

type Tab = "guest" | "customer" | "merchant";
type CustMode = "login" | "register" | "otp";

function WelcomeInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) || "customer");
  const [custMode, setCustMode] = useState<CustMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [debugCode, setDebugCode] = useState("");
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

  const sendOtpMail = async (em: string, code: string, nm: string) => {
    try {
      const r = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, code, name: nm }),
      });
      const j = await r.json();
      if (j.debugCode) setDebugCode(j.debugCode);
      return j;
    } catch {
      return { ok: false };
    }
  };

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setDebugCode("");
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
    await sendOtpMail(em, code, name.trim());
    setPendingEmail(em);
    setCustMode("otp");
    setInfo("أرسلنا رمز تحقق إلى بريدك. أدخله لإتمام التسجيل.");
    setLoading(false);
  };

  const confirmOtp = async (e: React.FormEvent) => {
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

    await supabase
      .from("customers")
      .update({ email_verified: true })
      .eq("email", em);

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

    setLoading(false);
    if (err || !data) {
      setError("بيانات الدخول غير صحيحة");
      return;
    }
    if (!data.is_active) {
      setError("الحساب موقوف");
      return;
    }
    if (!data.email_verified) {
      setPendingEmail(em);
      const code = await createAndStoreOtp(em, "register");
      await sendOtpMail(em, code, data.name);
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
    router.replace(next.startsWith("/") ? next : "/");
  };

  const field =
    "w-full border border-[#e8e2d9] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ink/20 bg-white";

  return (
    <div className="min-h-screen bg-[#f8f5f0] flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <BrandLogo size="md" />
      </div>

      <div className="w-full max-w-md bg-white border border-[#e8e2d9] rounded-3xl shadow-sm overflow-hidden">
        {/* Tabs */}
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
                tab === t.id
                  ? "bg-ink text-white"
                  : "bg-[#faf8f5] text-muted hover:text-ink"
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
              <button
                type="button"
                onClick={goGuest}
                className="w-full bg-ink text-white py-3.5 rounded-full text-sm font-semibold"
              >
                دخول كزائر
              </button>
              <button
                type="button"
                onClick={() => setTab("customer")}
                className="w-full text-sm text-muted underline"
              >
                لدي حساب عميل
              </button>
            </>
          )}

          {tab === "customer" && (
            <>
              <h1 className="text-lg font-bold text-center">
                {custMode === "otp"
                  ? "تأكيد البريد"
                  : custMode === "register"
                    ? "إنشاء حساب عميل"
                    : "دخول عميل"}
              </h1>

              {custMode !== "otp" && (
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

              {custMode === "otp" && (
                <form onSubmit={confirmOtp} className="space-y-3">
                  <p className="text-sm text-muted text-center">
                    أدخل الرمز المرسل إلى <strong dir="ltr">{pendingEmail}</strong>
                  </p>
                  {debugCode && (
                    <p className="text-xs text-center bg-amber-50 border border-amber-200 rounded-lg py-2">
                      وضع اختبار — الرمز: <strong className="font-mono tracking-widest">{debugCode}</strong>
                    </p>
                  )}
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
                      const em = pendingEmail || email;
                      const code = await createAndStoreOtp(em, "register");
                      await sendOtpMail(em, code, name || "عميل");
                      setInfo("تم إرسال رمز جديد");
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
              <p className="text-sm text-muted text-center">
                نفس المتجر مع صلاحيات رفع السعر والمحفظة
              </p>
              <a
                href="/merchant/login"
                className="block w-full text-center bg-ink text-white py-3.5 rounded-full text-sm font-semibold"
              >
                دخول تاجر
              </a>
              <a
                href="/merchant/register"
                className="block w-full text-center border border-ink py-3.5 rounded-full text-sm font-semibold"
              >
                تسجيل تاجر جديد
              </a>
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-muted mt-6 text-center max-w-sm">
        باختيارك المتابعة، توافق على استخدام المنصة وفق سياسة المتجر.
      </p>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted text-sm">
          ...
        </div>
      }
    >
      <WelcomeInner />
    </Suspense>
  );
}
