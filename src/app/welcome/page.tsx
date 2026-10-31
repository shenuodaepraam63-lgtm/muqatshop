"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { setSiteRole } from "@/lib/role";
import { getCustomerSession } from "@/lib/customer";
import { supabase } from "@/lib/supabase";
import { clearMerchantSession, getMerchantSession } from "@/lib/merchant";
import { authRedirectTo, syncCustomerFromAuthUser } from "@/lib/auth-customer";

type Tab = "guest" | "customer" | "merchant";
type CustMode = "login" | "register" | "forgot";

function WelcomeInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) || "customer");
  const [custMode, setCustMode] = useState<CustMode>(
    sp.get("mode") === "forgot"
      ? "forgot"
      : sp.get("mode") === "register"
        ? "register"
        : "login"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getMerchantSession()) {
      setSiteRole("merchant");
      router.replace("/merchant");
      return;
    }
    if (getCustomerSession()) {
      setSiteRole("customer");
      router.replace(next.startsWith("/") ? next : "/");
    }
  }, [router, next]);

  const goGuest = () => {
    clearMerchantSession();
    setSiteRole("guest");
    router.replace("/");
  };

  const afterCustomerAuth = async (opts?: { name?: string }) => {
    clearMerchantSession();
    setSiteRole("customer");
    const synced = await syncCustomerFromAuthUser(
      opts?.name ? { name: opts.name } : undefined
    );
    return synced;
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

    const { data, error: err } = await supabase.auth.signUp({
      email: em,
      password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo: authRedirectTo(
          `/auth/callback?next=${encodeURIComponent(next.startsWith("/") ? next : "/")}`
        ),
      },
    });

    if (err) {
      setLoading(false);
      setError(
        err.message.includes("already") || err.message.includes("registered")
          ? "البريد مسجّل بالفعل — سجّل الدخول أو استخدم نسيت كلمة المرور"
          : err.message
      );
      return;
    }

    if (data.session) {
      const synced = await afterCustomerAuth({ name: name.trim() });
      setLoading(false);
      if (!synced.ok) {
        setError(synced.error);
        return;
      }
      router.replace(next.startsWith("/") ? next : "/");
      return;
    }

    setLoading(false);
    setInfo(
      "أرسلنا رابط تأكيد إلى بريدك. افتح الرسالة واضغط على زر التأكيد لإكمال التسجيل."
    );
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    const em = email.trim().toLowerCase();

    const { error: err } = await supabase.auth.signInWithPassword({
      email: em,
      password,
    });

    if (err) {
      setLoading(false);
      const msg = err.message || "";
      if (msg.toLowerCase().includes("email not confirmed")) {
        setError("البريد غير مؤكد بعد — افتح رابط التأكيد في بريدك");
      } else if (msg.toLowerCase().includes("invalid")) {
        setError("بيانات الدخول غير صحيحة");
      } else {
        setError(msg);
      }
      return;
    }

    const synced = await afterCustomerAuth();
    setLoading(false);
    if (!synced.ok) {
      setError(synced.error);
      return;
    }
    router.replace(next.startsWith("/") ? next : "/");
  };

  const startForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    const em = email.trim().toLowerCase();

    const { error: err } = await supabase.auth.resetPasswordForEmail(em, {
      redirectTo: authRedirectTo("/auth/reset-password"),
    });

    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setInfo(
      "إن وُجد حساب بهذا البريد، ستصلك رسالة فيها رابط. بعد الضغط عليه ستفتح صفحة تعيين كلمة مرور جديدة."
    );
  };

  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(196,165,116,0.18),_transparent_55%)]" />

      <div className="relative z-10 mb-8">
        <BrandLogo size="md" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white border border-border rounded-card shadow-card overflow-hidden">
        <div className="grid grid-cols-3 border-b border-border">
          {(
            [
              { id: "guest" as Tab, label: "زائر" },
              { id: "customer" as Tab, label: "عميل" },
              { id: "merchant" as Tab, label: "مسوق" },
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
                  : "bg-surface-2/80 text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {tab === "guest" && (
            <>
              <h1 className="text-lg font-bold text-center text-ink">تصفح كزائر</h1>
              <p className="text-sm text-muted text-center leading-relaxed">
                تشوف المنتجات والأسعار عادي. للشراء أو السلة هتحتاج تسجّل كعميل.
              </p>
              <button type="button" onClick={goGuest} className="btn-primary w-full">
                دخول كزائر
              </button>
            </>
          )}

          {tab === "customer" && (
            <>
              <h1 className="text-lg font-bold text-center text-ink">
                {custMode === "forgot"
                  ? "استعادة كلمة المرور"
                  : custMode === "register"
                    ? "إنشاء حساب عميل"
                    : "دخول عميل"}
              </h1>

              {custMode !== "forgot" && (
                <div className="flex rounded-xl bg-surface-2 p-1 text-sm">
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-lg transition ${
                      custMode === "login"
                        ? "bg-white font-semibold shadow-soft text-ink"
                        : "text-muted"
                    }`}
                    onClick={() => setCustMode("login")}
                  >
                    دخول
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-lg transition ${
                      custMode === "register"
                        ? "bg-white font-semibold shadow-soft text-ink"
                        : "text-muted"
                    }`}
                    onClick={() => setCustMode("register")}
                  >
                    حساب جديد
                  </button>
                </div>
              )}

              {custMode === "login" && (
                <form onSubmit={login} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="البريد الإلكتروني"
                    className="input-field"
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="كلمة المرور"
                    className="input-field"
                  />
                  {error && <p className="text-sm text-sale">{error}</p>}
                  {info && <p className="text-sm text-muted">{info}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? "..." : "دخول كعميل"}
                  </button>
                  <button
                    type="button"
                    className="w-full text-xs text-muted underline hover:text-ink"
                    onClick={() => {
                      setCustMode("forgot");
                      setError("");
                      setInfo("");
                    }}
                  >
                    نسيت كلمة المرور؟
                  </button>
                </form>
              )}

              {custMode === "register" && (
                <form onSubmit={register} className="space-y-3">
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="الاسم الكامل"
                    className="input-field"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="البريد الإلكتروني"
                    className="input-field"
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="كلمة المرور (6+ أحرف)"
                    className="input-field"
                  />
                  {error && <p className="text-sm text-sale">{error}</p>}
                  {info && (
                    <p className="text-sm text-muted leading-relaxed">{info}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? "..." : "إنشاء حساب وإرسال رابط التأكيد"}
                  </button>
                </form>
              )}

              {custMode === "forgot" && (
                <form onSubmit={startForgot} className="space-y-3">
                  <p className="text-sm text-muted text-center">
                    نرسل رابطًا يفتح صفحة <strong>تعيين كلمة مرور جديدة</strong>.
                  </p>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="البريد الإلكتروني"
                    className="input-field"
                  />
                  {error && <p className="text-sm text-sale">{error}</p>}
                  {info && (
                    <p className="text-sm text-muted leading-relaxed">{info}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? "..." : "إرسال رابط الاستعادة"}
                  </button>
                  <button
                    type="button"
                    className="w-full text-xs text-muted hover:text-ink"
                    onClick={() => setCustMode("login")}
                  >
                    العودة لتسجيل الدخول
                  </button>
                </form>
              )}
            </>
          )}

          {tab === "merchant" && (
            <>
              <h1 className="text-lg font-bold text-center text-ink">
                بوابة المسوق
              </h1>
              <p className="text-sm text-muted text-center leading-relaxed">
                حساب منفصل عن العميل — كتالوج، أوردرات، وأرباح جوه البوابة فقط.
              </p>
              <a href="/merchant/login" className="btn-primary w-full">
                دخول مسوق
              </a>
              <a href="/merchant/register" className="btn-secondary w-full">
                إنشاء حساب مسوق
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted text-sm bg-page">
          ...
        </div>
      }
    >
      <WelcomeInner />
    </Suspense>
  );
}
