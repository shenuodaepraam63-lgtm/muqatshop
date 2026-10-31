"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Save, Trash2 } from "lucide-react";
import { DEFAULT_HOMEPAGE_CONFIG, HOME_SECTION_KEYS, type HomeSectionKey, type HomepageConfig } from "@/lib/homepage-config";
import { supabase } from "@/lib/supabase";

const sectionLabels: Record<HomeSectionKey, string> = {
  hero: "Hero",
  trust: "مؤشرات الثقة",
  categories: "التصنيفات",
  featuredProducts: "المنتجات المميزة",
  howItWorks: "كيف تعمل Muqatshop",
  partnerships: "التجار والمسوقون",
  deals: "العروض",
  whyUs: "لماذا Muqatshop",
  join: "خطوات الانضمام",
  faq: "الأسئلة الشائعة",
  finalCta: "الدعوة الختامية",
};
const fieldClass = "w-full rounded-xl border border-[#D6DDEA] bg-white px-3 py-2.5 text-sm text-[#202B3C] outline-none focus:border-[#3157D5] focus:ring-2 focus:ring-[#3157D5]/15";

export function HomepageSettingsForm() {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: sessionData }, categoryResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from("categories").select("id,name").eq("is_active", true).is("parent_id", null).order("sort_order", { ascending: true }).limit(50),
      ]);
      const token = sessionData.session?.access_token;
      if (categoryResult.data && active) setCategories(categoryResult.data);
      if (!token) {
        if (active) { setMessage("سجّل الدخول بحساب المسؤول لتحميل إعدادات الصفحة."); setLoading(false); }
        return;
      }
      const response = await fetch("/api/admin/homepage-settings", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (active) {
        if (response.ok && result.config) setConfig(result.config as HomepageConfig);
        else setMessage(result.error || "تعذر تحميل إعدادات الصفحة.");
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const updateAnnouncement = (key: keyof HomepageConfig["announcement"], value: string | boolean) => setConfig((current) => ({ ...current, announcement: { ...current.announcement, [key]: value } }));
  const updateHero = (key: keyof HomepageConfig["hero"], value: string) => setConfig((current) => ({ ...current, hero: { ...current.hero, [key]: value } }));

  const save = async () => {
    setSaving(true);
    setMessage("");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) { setSaving(false); setMessage("انتهت الجلسة. سجّل الدخول ثم حاول مرة أخرى."); return; }
    const response = await fetch("/api/admin/homepage-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(config),
    });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    setMessage(response.ok ? "تم حفظ إعدادات الصفحة الرئيسية." : (result.error || "تعذر حفظ الإعدادات."));
  };

  const moveSection = (index: number, delta: -1 | 1) => setConfig((current) => {
    const order = [...current.sectionOrder];
    const next = index + delta;
    if (next < 0 || next >= order.length) return current;
    [order[index], order[next]] = [order[next], order[index]];
    return { ...current, sectionOrder: order };
  });

  const updateFaq = (index: number, key: "question" | "answer", value: string) => setConfig((current) => ({ ...current, faqs: current.faqs.map((faq, i) => i === index ? { ...faq, [key]: value } : faq) }));

  if (loading) return <p className="text-sm text-[#718096]">جاري تحميل إعدادات الصفحة...</p>;

  return <div className="mx-auto max-w-4xl space-y-6">
    <header><p className="text-xs font-bold uppercase tracking-wider text-[#3157D5]">إدارة المحتوى</p><h1 className="mt-1 text-2xl font-bold text-[#14243A]">الصفحة الرئيسية</h1><p className="mt-2 text-sm text-[#718096]">التغييرات تحفظ في إعدادات المتجر ولا تنشر نسخة جديدة من الموقع.</p></header>

    <section className="space-y-4 rounded-2xl border border-[#E4E9F0] bg-white p-5">
      <h2 className="font-bold text-[#14243A]">الشريط الإعلاني</h2>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.announcement.enabled} onChange={(event) => updateAnnouncement("enabled", event.target.checked)} />إظهار الإعلان</label>
      <label className="block text-sm">النص<input className={`${fieldClass} mt-1`} value={config.announcement.text} onChange={(event) => updateAnnouncement("text", event.target.value)} maxLength={250} /></label>
      <label className="block text-sm">الرابط<input className={`${fieldClass} mt-1`} value={config.announcement.href} onChange={(event) => updateAnnouncement("href", event.target.value)} placeholder="/shop" /></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm">يبدأ في<input type="datetime-local" className={`${fieldClass} mt-1`} value={config.announcement.startsAt} onChange={(event) => updateAnnouncement("startsAt", event.target.value)} /></label><label className="block text-sm">ينتهي في<input type="datetime-local" className={`${fieldClass} mt-1`} value={config.announcement.endsAt} onChange={(event) => updateAnnouncement("endsAt", event.target.value)} /></label></div>
    </section>

    <section className="space-y-4 rounded-2xl border border-[#E4E9F0] bg-white p-5">
      <h2 className="font-bold text-[#14243A]">Hero</h2>
      <label className="block text-sm">العنوان التمهيدي<input className={`${fieldClass} mt-1`} value={config.hero.eyebrow} onChange={(event) => updateHero("eyebrow", event.target.value)} /></label>
      <label className="block text-sm">العنوان الرئيسي<input className={`${fieldClass} mt-1`} value={config.hero.title} onChange={(event) => updateHero("title", event.target.value)} /></label>
      <label className="block text-sm">الوصف<textarea rows={3} className={`${fieldClass} mt-1`} value={config.hero.description} onChange={(event) => updateHero("description", event.target.value)} /></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm">نص الزر الأساسي<input className={`${fieldClass} mt-1`} value={config.hero.primaryLabel} onChange={(event) => updateHero("primaryLabel", event.target.value)} /></label><label className="block text-sm">رابط الزر الأساسي<input className={`${fieldClass} mt-1`} value={config.hero.primaryHref} onChange={(event) => updateHero("primaryHref", event.target.value)} /></label><label className="block text-sm">نص الزر الثانوي<input className={`${fieldClass} mt-1`} value={config.hero.secondaryLabel} onChange={(event) => updateHero("secondaryLabel", event.target.value)} /></label><label className="block text-sm">رابط الزر الثانوي<input className={`${fieldClass} mt-1`} value={config.hero.secondaryHref} onChange={(event) => updateHero("secondaryHref", event.target.value)} /></label></div>
      <label className="block text-sm">مسار صورة Hero (داخلية أو HTTPS)<input dir="ltr" className={`${fieldClass} mt-1`} value={config.hero.image} onChange={(event) => updateHero("image", event.target.value)} /></label>
    </section>

    <section className="space-y-3 rounded-2xl border border-[#E4E9F0] bg-white p-5">
      <div><h2 className="font-bold text-[#14243A]">التصنيفات المميزة</h2><p className="mt-1 text-xs text-[#718096]">عند عدم اختيار تصنيف، تظهر أول عشرة تصنيفات نشطة حسب ترتيب الإدارة.</p></div>
      <div className="grid gap-2 sm:grid-cols-2">{categories.map((category) => <label key={category.id} className="flex items-center gap-2 rounded-lg border border-[#E4E9F0] px-3 py-2 text-sm"><input type="checkbox" checked={config.featuredCategoryIds.includes(category.id)} onChange={(event) => setConfig((current) => ({ ...current, featuredCategoryIds: event.target.checked ? [...current.featuredCategoryIds, category.id] : current.featuredCategoryIds.filter((id) => id !== category.id) }))} />{category.name}</label>)}</div>
    </section>

    <section className="space-y-3 rounded-2xl border border-[#E4E9F0] bg-white p-5">
      <div><h2 className="font-bold text-[#14243A]">ظهور الأقسام وترتيبها</h2><p className="mt-1 text-xs text-[#718096]">المنتجات المميزة والخصومات تُدار من صفحة المنتجات وفق الحالة والمخزون الفعلي.</p></div>
      <ol className="space-y-2">{config.sectionOrder.map((section, index) => <li key={section} className="flex items-center gap-2 rounded-lg border border-[#E4E9F0] p-2"><input type="checkbox" aria-label={`إظهار ${sectionLabels[section]}`} checked={config.sectionVisibility[section]} onChange={(event) => setConfig((current) => ({ ...current, sectionVisibility: { ...current.sectionVisibility, [section]: event.target.checked } }))} /><span className="flex-1 text-sm font-medium">{sectionLabels[section]}</span><button type="button" disabled={index === 0} onClick={() => moveSection(index, -1)} aria-label="تحريك للأعلى" className="rounded p-1 hover:bg-[#F6F8FB] disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button><button type="button" disabled={index === config.sectionOrder.length - 1} onClick={() => moveSection(index, 1)} aria-label="تحريك للأسفل" className="rounded p-1 hover:bg-[#F6F8FB] disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button></li>)}</ol>
    </section>

    <section className="space-y-4 rounded-2xl border border-[#E4E9F0] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-bold text-[#14243A]">الأسئلة الشائعة</h2><p className="mt-1 text-xs text-[#718096]">حتى عشرة أسئلة؛ لا تُعرض الأسئلة الفارغة.</p></div><button type="button" onClick={() => setConfig((current) => ({ ...current, faqs: [...current.faqs, { question: "", answer: "" }].slice(0, 10) }))} disabled={config.faqs.length >= 10} className="inline-flex items-center gap-1 rounded-lg border border-[#D6DDEA] px-3 py-2 text-xs font-semibold disabled:opacity-40"><Plus className="h-4 w-4" />إضافة سؤال</button></div>
      {config.faqs.map((faq, index) => <div key={index} className="space-y-2 rounded-xl bg-[#F6F8FB] p-3"><div className="flex items-center gap-2"><input className={fieldClass} value={faq.question} onChange={(event) => updateFaq(index, "question", event.target.value)} placeholder="السؤال" /><button type="button" onClick={() => setConfig((current) => ({ ...current, faqs: current.faqs.filter((_, i) => i !== index) }))} aria-label="حذف السؤال" className="rounded-lg p-2 text-[#D64C4C] hover:bg-white"><Trash2 className="h-4 w-4" /></button></div><textarea rows={2} className={fieldClass} value={faq.answer} onChange={(event) => updateFaq(index, "answer", event.target.value)} placeholder="الإجابة" /></div>)}
    </section>

    <section className="space-y-2 rounded-2xl border border-[#E4E9F0] bg-white p-5"><h2 className="font-bold text-[#14243A]">التواصل</h2><label className="block text-sm">بريد التواصل<input dir="ltr" type="email" className={`${fieldClass} mt-1`} value={config.contactEmail} onChange={(event) => setConfig((current) => ({ ...current, contactEmail: event.target.value }))} /></label></section>

    <div className="flex flex-wrap items-center gap-4"><button type="button" onClick={save} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#3157D5] px-5 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "جاري الحفظ..." : "حفظ إعدادات الصفحة"}</button>{message && <p aria-live="polite" className="text-sm text-[#526174]">{message}</p>}</div>
    <p className="text-xs leading-6 text-[#718096]">لا يوجد في المنصة حاليًا نموذج مستقل لتسجيل مورّدين/تجّار؛ زر التعاون يوجّه لبريد التواصل بدل إرسال المستخدم إلى نموذج مسوق. لا تُحفظ كلمات مرور أو مفاتيح API هنا.</p>
  </div>;
}
