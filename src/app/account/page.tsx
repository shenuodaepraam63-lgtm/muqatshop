"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getCustomerSession,
  saveCustomerSession,
  clearCustomerSession,
} from "@/lib/customer";
import { clearSiteRole } from "@/lib/role";
import { supabase } from "@/lib/supabase";
import {
  EGYPT_GOVERNORATES,
  GOVERNORATE_NAMES,
} from "@/lib/egypt-locations";

const COUNTRIES = [
  "مصر",
  "السعودية",
  "الإمارات",
  "الكويت",
  "قطر",
  "البحرين",
  "عمان",
  "الأردن",
  "فلسطين",
  "لبنان",
  "العراق",
  "المغرب",
  "تونس",
  "الجزائر",
  "ليبيا",
  "السودان",
  "سوريا",
  "اليمن",
  "أخرى",
];

export default function AccountPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("مصر");
  const [governorate, setGovernorate] = useState("");
  const [center, setCenter] = useState("");
  const [area, setArea] = useState("");
  const [street, setStreet] = useState("");
  const [apartment, setApartment] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [appNote, setAppNote] = useState("");
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [appLoading, setAppLoading] = useState(false);

  const [deleteStep, setDeleteStep] = useState<"idle" | "code">("idle");
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const centers = useMemo(() => {
    if (country !== "مصر" || !governorate) return [];
    return EGYPT_GOVERNORATES[governorate] || [];
  }, [country, governorate]);

  useEffect(() => {
    const s = getCustomerSession();
    if (!s) {
      router.replace("/welcome?tab=customer&next=/account");
      return;
    }
    setCustomerId(s.id);
    setName(s.name);
    setEmail(s.email);
    setPhone(s.phone || "");
    (async () => {
      const { data } = await supabase.from("customers").select("*").eq("id", s.id).maybeSingle();
      if (data) {
        setName(data.name || s.name);
        setPhone(data.phone || "");
        setCountry(data.country || "مصر");
        setGovernorate(data.governorate || "");
        setCenter(data.center || "");
        setArea(data.area || "");
        setStreet(data.street || "");
        setApartment(data.apartment || "");
      }
      const { data: app } = await supabase
        .from("merchant_applications")
        .select("status")
        .eq("customer_id", s.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setAppStatus(app?.status || null);
      setReady(true);
    })();
  }, [router]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    if (!name.trim()) {
      setErr("الاسم مطلوب");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("customers")
      .update({
        name: name.trim(),
        phone: phone.trim() || null,
        country: country || "مصر",
        governorate: country === "مصر" ? governorate || null : null,
        center: country === "مصر" ? center || null : null,
        area: area.trim() || null,
        street: street.trim() || null,
        apartment: apartment.trim() || null,
      })
      .eq("id", customerId);
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    saveCustomerSession({
      id: customerId,
      email,
      name: name.trim(),
      phone: phone.trim() || null,
    });
    setMsg("تم حفظ بياناتك");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    clearCustomerSession();
    clearSiteRole();
    router.replace("/welcome");
  };

  /**
   * يطلب رمزًا رقميًا من Supabase Auth (قالب Reauthentication / OTP)
   * عبر reauthenticate، مع احتياطي signInWithOtp
   */
  const requestDeleteCode = async () => {
    setErr("");
    setMsg("");
    if (!confirm("سيتم إرسال رمز تحقق رقمي من Supabase إلى بريدك لتأكيد حذف الحساب. متابعة؟"))
      return;

    setDeleteLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // إن لم تكن جلسة Auth: نطلب OTP بالبريد مباشرة (بدون إنشاء مستخدم جديد)
    if (!session) {
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      });
      setDeleteLoading(false);
      if (otpErr) {
        setErr(
          otpErr.message.includes("Signups not allowed") ||
            otpErr.message.toLowerCase().includes("user not found")
            ? "لازم تسجّل دخول بحساب مؤكد من الرابط أولًا، ثم تحذف الحساب"
            : otpErr.message
        );
        return;
      }
      setDeleteStep("code");
      setDeleteOtp("");
      setMsg("أرسلنا رمزًا رقميًا إلى بريدك عبر Supabase. أدخله لتأكيد الحذف.");
      return;
    }

    // مع جلسة: إعادة مصادقة — يستخدم قالب Reauthentication و{{ .Token }}
    const { error: reErr } = await supabase.auth.reauthenticate();
    if (reErr) {
      // احتياطي: OTP بالبريد
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      });
      setDeleteLoading(false);
      if (otpErr) {
        setErr(reErr.message || otpErr.message);
        return;
      }
      setDeleteStep("code");
      setDeleteOtp("");
      setMsg("أرسلنا رمزًا رقميًا إلى بريدك عبر Supabase. أدخله لتأكيد الحذف.");
      return;
    }

    setDeleteLoading(false);
    setDeleteStep("code");
    setDeleteOtp("");
    setMsg("أرسلنا رمز التحقق الرقمي إلى بريدك (من Supabase). أدخله لتأكيد الحذف النهائي.");
  };

  const confirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setDeleteLoading(true);

    const em = email.trim().toLowerCase();
    const token = deleteOtp.trim();

    // التحقق من الرمز الرقمي عبر Supabase
    let verified = false;
    const attempts: Array<{ type: "email" | "signup" | "recovery" | "invite" }> = [
      { type: "email" },
    ];

    for (const a of attempts) {
      const { error: vErr } = await supabase.auth.verifyOtp({
        email: em,
        token,
        type: a.type,
      });
      if (!vErr) {
        verified = true;
        break;
      }
    }

    if (!verified) {
      // بعض الإصدارات تستخدم type مرتبط بإعادة المصادقة كـ email فقط؛
      // إن فشل: رسالة واضحة
      setDeleteLoading(false);
      setErr("رمز التحقق غير صحيح أو منتهي — اطلب رمزًا جديدًا");
      return;
    }

    // حذف بيانات الملف المرتبط بالمتجر
    await supabase.from("merchant_applications").delete().eq("customer_id", customerId);
    await supabase.from("customer_otps").delete().eq("email", em);

    const { error: delErr } = await supabase.from("customers").delete().eq("id", customerId);
    if (delErr) {
      // تعطيل بدل الحذف إن فشل
      await supabase
        .from("customers")
        .update({ is_active: false, email_verified: false })
        .eq("id", customerId);
    }

    // إنهاء جلسة Auth (حذف مستخدم Auth نفسه يحتاج Service Role من السيرفر)
    await supabase.auth.signOut();
    clearCustomerSession();
    clearSiteRole();
    setDeleteLoading(false);
    router.replace("/welcome?tab=customer");
  };

  const applyMerchant = async () => {
    setErr("");
    setMsg("");
    setAppLoading(true);
    const { data: existing } = await supabase
      .from("merchant_applications")
      .select("id, status")
      .eq("customer_id", customerId)
      .eq("status", "pending")
      .maybeSingle();
    if (existing) {
      setAppLoading(false);
      setAppStatus("pending");
      setMsg("عندك طلب قيد المراجعة بالفعل");
      return;
    }
    const { error } = await supabase.from("merchant_applications").insert({
      customer_id: customerId,
      name: name.trim(),
      email,
      phone: phone.trim() || null,
      note: appNote.trim() || null,
      status: "pending",
    });
    setAppLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setAppStatus("pending");
    setMsg("تم إرسال طلب التاجر — بانتظار موافقة الإدارة");
  };

  if (!ready) {
    return (
      <div className="max-w-page mx-auto px-4 py-16 text-center text-muted text-sm">
        جاري التحميل...
      </div>
    );
  }

  const field = "w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white";

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">حسابي</h1>
        <Link href="/shop" className="text-sm text-muted">
          المتجر
        </Link>
      </div>

      <form onSubmit={save} className="bg-white border border-border rounded-2xl p-5 space-y-3">
        <p className="text-xs text-muted">البريد (لا يتغير)</p>
        <input className={field} value={email} disabled dir="ltr" />

        <label className="block text-sm font-medium">الاسم</label>
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} required />

        <label className="block text-sm font-medium">رقم التليفون</label>
        <input
          className={field}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01xxxxxxxxx"
        />

        <label className="block text-sm font-medium">البلد</label>
        <select
          className={field}
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setGovernorate("");
            setCenter("");
          }}
        >
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {country === "مصر" && (
          <>
            <label className="block text-sm font-medium">المحافظة</label>
            <select
              className={field}
              value={governorate}
              onChange={(e) => {
                setGovernorate(e.target.value);
                setCenter("");
              }}
            >
              <option value="">اختر المحافظة</option>
              {GOVERNORATE_NAMES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <label className="block text-sm font-medium">المركز / القسم</label>
            <select
              className={field}
              value={center}
              onChange={(e) => setCenter(e.target.value)}
              disabled={!governorate}
            >
              <option value="">{governorate ? "اختر المركز" : "اختر المحافظة أولاً"}</option>
              {centers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </>
        )}

        <label className="block text-sm font-medium">المنطقة</label>
        <input className={field} value={area} onChange={(e) => setArea(e.target.value)} />
        <label className="block text-sm font-medium">الشارع</label>
        <input className={field} value={street} onChange={(e) => setStreet(e.target.value)} />
        <label className="block text-sm font-medium">الشقة / المبنى</label>
        <input className={field} value={apartment} onChange={(e) => setApartment(e.target.value)} />

        {err && deleteStep === "idle" && <p className="text-sm text-sale">{err}</p>}
        {msg && deleteStep === "idle" && <p className="text-sm text-green-700">{msg}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-ink text-white py-3 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "..." : "حفظ البيانات"}
        </button>
      </form>

      <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold">طلب حساب تاجر</h2>
        {appStatus === "pending" && (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            طلبك قيد المراجعة من الإدارة
          </p>
        )}
        {appStatus === "approved" && (
          <p className="text-sm text-green-700">تمت الموافقة — سجّل دخول التاجر من /merchant/login</p>
        )}
        {appStatus === "rejected" && (
          <p className="text-sm text-sale">تم رفض الطلب السابق — يمكنك التقديم مرة أخرى</p>
        )}
        {appStatus !== "pending" && appStatus !== "approved" && (
          <>
            <textarea
              className={`${field} min-h-[70px]`}
              value={appNote}
              onChange={(e) => setAppNote(e.target.value)}
              placeholder="ملاحظة اختيارية للإدارة"
            />
            <button
              type="button"
              disabled={appLoading}
              onClick={applyMerchant}
              className="w-full border border-ink py-3 rounded-full text-sm font-semibold disabled:opacity-50"
            >
              {appLoading ? "..." : "تقديم طلب لأن أصبح تاجرًا"}
            </button>
          </>
        )}
      </div>

      <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-sale">حذف الحساب</h2>
        <p className="text-xs text-muted leading-relaxed">
          الحذف نهائي. يتم إرسال <strong>رمز رقمي</strong> من <strong>Supabase</strong> إلى بريدك
          (قالب إعادة المصادقة / OTP). بعد إدخال الرمز الصحيح يُحذف ملفك وتُنهى الجلسة.
        </p>
        {deleteStep === "idle" && (
          <button
            type="button"
            disabled={deleteLoading}
            onClick={requestDeleteCode}
            className="w-full border border-sale text-sale py-3 rounded-full text-sm font-medium disabled:opacity-50"
          >
            {deleteLoading ? "جاري إرسال الرمز..." : "طلب رمز حذف الحساب"}
          </button>
        )}
        {deleteStep === "code" && (
          <form onSubmit={confirmDelete} className="space-y-3">
            {msg && <p className="text-sm text-green-700">{msg}</p>}
            {err && <p className="text-sm text-sale">{err}</p>}
            <input
              inputMode="numeric"
              maxLength={8}
              required
              value={deleteOtp}
              onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="الرمز الرقمي من الإيميل"
              className={`${field} text-center tracking-widest font-mono text-lg`}
              dir="ltr"
              autoComplete="one-time-code"
            />
            <button
              type="submit"
              disabled={deleteLoading || deleteOtp.length < 6}
              className="w-full bg-sale text-white py-3 rounded-full text-sm font-semibold disabled:opacity-50"
            >
              {deleteLoading ? "..." : "تأكيد الحذف النهائي"}
            </button>
            <button
              type="button"
              className="w-full text-xs text-muted"
              onClick={() => {
                setDeleteStep("idle");
                setDeleteOtp("");
                setErr("");
                setMsg("");
              }}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="w-full text-xs underline text-muted"
              disabled={deleteLoading}
              onClick={requestDeleteCode}
            >
              إعادة إرسال الرمز
            </button>
          </form>
        )}
      </div>

      <div className="space-y-2">
        <Link
          href="/welcome?tab=customer&mode=forgot"
          className="block w-full text-center border border-border py-3 rounded-full text-sm"
        >
          نسيت / تغيير كلمة المرور
        </Link>
        <button
          type="button"
          onClick={logout}
          className="w-full bg-[#f0ebe3] py-3 rounded-full text-sm font-medium"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
