"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { GOVERNORATE_NAMES } from "@/lib/egypt-locations";
import { registerWithSupabaseAuth, validateRegisterBase } from "@/lib/register-account";
import { supabase } from "@/lib/supabase";

const BUSINESS_TYPES = [
  "متجر إلكتروني",
  "محل تجاري",
  "شركة",
  "مصنع",
  "مورد منتجات",
  "نشاط آخر",
];

export default function RegisterSupplierPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [description, setDescription] = useState("");
  const [businessUrl, setBusinessUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .order("name")
        .limit(80);
      if (data) setCategories(data);
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!terms) {
      setError("يجب الموافقة على شروط التعاون مع Muqatshop.");
      return;
    }
    if (!businessName.trim()) {
      setError("يرجى إدخال اسم النشاط.");
      return;
    }
    if (!businessType) {
      setError("يرجى اختيار نوع النشاط.");
      return;
    }
    if (!governorate) {
      setError("يرجى اختيار المحافظة.");
      return;
    }

    const base = {
      fullName,
      email,
      phone,
      password,
      accountType: "supplier" as const,
    };
    const v = validateRegisterBase(base, password2);
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      const res = await registerWithSupabaseAuth(base, {
        supplier: {
          businessName: businessName.trim(),
          businessType,
          governorate,
          description: description.trim() || undefined,
          businessUrl: businessUrl.trim() || undefined,
          categoryId: categoryId || null,
        },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(
        res.needsEmailConfirm
          ? `/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&type=supplier`
          : "/account/pending?type=supplier"
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
      title="طلب تعاون كتاجر"
      description="أرسل بيانات نشاطك لمراجعتها من فريق Muqatshop."
      brandingMessage="إضافة المنتجات متاحة بعد اعتماد الحساب من الإدارة."
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
        <p className="text-xs font-semibold text-[#718096]">البيانات الشخصية</p>
        <div>
          <label className="block text-sm font-semibold mb-1">اسم صاحب الحساب</label>
          <input className={field} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">البريد الإلكتروني</label>
          <input type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">رقم الهاتف</label>
          <input type="tel" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" required />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">كلمة المرور</label>
          <div className="relative">
            <input type={showPass ? "text" : "password"} className={`${field} pe-14`} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="absolute inset-y-0 end-0 px-3 text-xs font-semibold text-[#718096]" onClick={() => setShowPass((s) => !s)}>
              {showPass ? "إخفاء" : "إظهار"}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">تأكيد كلمة المرور</label>
          <input type={showPass ? "text" : "password"} className={field} value={password2} onChange={(e) => setPassword2(e.target.value)} required />
        </div>

        <p className="text-xs font-semibold text-[#718096] pt-2">بيانات النشاط التجاري</p>
        <div>
          <label className="block text-sm font-semibold mb-1">اسم النشاط</label>
          <input className={field} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="اسم المتجر أو الشركة" required />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">نوع النشاط</label>
          <select className={field} value={businessType} onChange={(e) => setBusinessType(e.target.value)} required>
            <option value="">اختر نوع النشاط</option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">مجال المنتجات</label>
          <select className={field} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">اختياري — اختر تصنيفًا</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">المحافظة</label>
          <select className={field} value={governorate} onChange={(e) => setGovernorate(e.target.value)} required>
            <option value="">اختر المحافظة</option>
            {GOVERNORATE_NAMES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">وصف النشاط</label>
          <textarea
            rows={3}
            className="w-full rounded-[10px] border border-[#E4E9F0] px-3 py-2 text-[15px] outline-none focus:border-[#3157D5]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اكتب نبذة مختصرة عن نشاطك ومنتجاتك."
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">رابط النشاط</label>
          <input className={field} value={businessUrl} onChange={(e) => setBusinessUrl(e.target.value)} placeholder="الموقع أو صفحات التواصل (اختياري)" />
        </div>

        <label className="flex items-start gap-2 text-sm text-[#718096] cursor-pointer">
          <input type="checkbox" className="mt-1" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>أوافق على شروط التعاون مع Muqatshop.</span>
        </label>

        {error ? <p className="text-sm text-[#D64C4C]" role="alert">{error}</p> : null}

        <button type="submit" disabled={loading} className="w-full h-[50px] rounded-[10px] bg-[#3157D5] text-white font-semibold disabled:opacity-60">
          {loading ? "جاري الإرسال..." : "إرسال طلب التعاون"}
        </button>
      </form>
    </AuthShell>
  );
}
