import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpLeft,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Handshake,
  Package,
  Search,
  ShoppingBag,
  Store,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { Category, Product } from "@/lib/supabase";
import type { HomepageConfig } from "@/lib/homepage-config";
import { HomeProductCard } from "@/components/home/HomeProductCard";

type SectionProps = { config: HomepageConfig };

function SectionHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return <div className="mb-7 max-w-2xl">
    {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-[#3157D5]">{eyebrow}</p>}
    <h2 className="text-2xl font-bold leading-tight text-[#14243A] sm:text-3xl">{title}</h2>
    {description && <p className="mt-3 text-sm leading-7 text-[#718096] sm:text-base">{description}</p>}
  </div>;
}

export function HomeHero({ config }: SectionProps) {
  return <section className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 pb-10 pt-10 sm:px-6 md:gap-10 md:pb-16 md:pt-16 lg:grid-cols-[1fr_.92fr] lg:px-8 lg:gap-14">
    <div className="home-reveal order-1 max-w-2xl">
      <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D9E4FF] bg-white px-3 py-1.5 text-xs font-bold text-[#3157D5]"><span className="h-2 w-2 rounded-full bg-[#18A999]" />{config.hero.eyebrow}</p>
      <h1 className="max-w-[14ch] text-3xl font-bold leading-[1.35] text-[#14243A] sm:text-4xl lg:text-[3.25rem]">{config.hero.title}</h1>
      <p className="mt-5 max-w-xl text-base leading-8 text-[#526174] sm:text-lg">{config.hero.description}</p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href={config.hero.primaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#3157D5] px-6 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#2447B8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3157D5]">{config.hero.primaryLabel}<ArrowLeft className="h-4 w-4" /></Link>
        <Link href={config.hero.secondaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#14243A] bg-white px-6 text-sm font-semibold text-[#14243A] transition hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3157D5]">{config.hero.secondaryLabel}<ArrowUpLeft className="h-4 w-4" /></Link>
      </div>
      <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-[#718096]"><span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#21865B]" />تجربة شراء منظمة</span><span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#21865B]" />مسار واضح للمسوقين</span></div>
    </div>
    <div className="home-image-reveal order-2 relative mx-auto aspect-[4/3] w-full max-w-[620px] overflow-hidden rounded-2xl border border-[#E4E9F0] bg-[#F6F8FB] shadow-[0_24px_60px_rgba(20,36,58,.08)]">
      {config.hero.image ? <Image src={config.hero.image} alt="منتجات متنوعة تمثل تجربة Muqatshop التجارية" fill priority sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover" /> : <div className="absolute inset-0 grid place-items-center"><ShoppingBag className="h-16 w-16 text-[#3157D5]" /></div>}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#14243A]/10 to-transparent" />
    </div>
  </section>;
}

const trustItems: { icon: LucideIcon; title: string; description: string; tone: string }[] = [
  { icon: Package, title: "منتجات متنوعة", description: "اكتشف منتجات من مجالات مختلفة.", tone: "bg-[#EEF3FF] text-[#3157D5]" },
  { icon: Handshake, title: "شراكات تجارية", description: "تواصل مع شبكة من أصحاب المنتجات.", tone: "bg-[#EFF8F6] text-[#168B7D]" },
  { icon: TrendingUp, title: "فرص للمسوقين", description: "سوّق المنتجات المتاحة وتابع عمولتك.", tone: "bg-[#EEF3FF] text-[#3157D5]" },
  { icon: ClipboardList, title: "تجربة منظمة", description: "تابع الطلبات والعمليات من منصة واحدة.", tone: "bg-[#EFF8F6] text-[#168B7D]" },
];

export function TrustSection() {
  return <section className="mx-auto max-w-[1280px] px-4 pb-10 sm:px-6 lg:px-8">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {trustItems.map(({ icon: Icon, title, description, tone }) => <article key={title} className="rounded-xl border border-[#E4E9F0] bg-white p-4 sm:p-5"><span className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}><Icon className="h-5 w-5" /></span><h2 className="text-sm font-bold text-[#14243A] sm:text-base">{title}</h2><p className="mt-1 text-xs leading-5 text-[#718096] sm:text-sm">{description}</p></article>)}
    </div>
  </section>;
}

export function CategorySection({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;
  return <section id="categories" className="scroll-mt-28 bg-[#F6F8FB] py-12 sm:py-16">
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3"><SectionHeading eyebrow="اختياراتك" title="اكتشف المنتجات حسب التصنيف" description="تصفح مجموعات المنتجات واعثر على ما تبحث عنه بسهولة." /><Link href="/categories" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-[#3157D5]">كل التصنيفات <ArrowUpLeft className="h-4 w-4" /></Link></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4">
        {categories.map((category, index) => <Link key={category.id} href={`/categories/${encodeURIComponent(category.slug)}`} className="group overflow-hidden rounded-xl border border-[#E4E9F0] bg-white transition duration-200 hover:-translate-y-[3px] hover:shadow-md">
          <div className={`relative grid aspect-[4/3] place-items-center overflow-hidden ${index % 3 === 0 ? "bg-[#EEF3FF]" : index % 3 === 1 ? "bg-[#EFF8F6]" : "bg-[#F2F5F9]"}`}>
            {category.image ? <Image src={category.image} alt={category.name} fill sizes="(max-width: 640px) 50vw, 20vw" className="object-cover transition duration-300 group-hover:scale-105" /> : <PackageSearchIcon />}
            <span className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#14243A]/[.07] to-transparent" />
          </div>
          <div className="flex min-h-14 items-center justify-between gap-2 px-3 py-3"><span className="line-clamp-2 text-sm font-semibold text-[#202B3C]">{category.name}</span><ArrowUpLeft className="h-4 w-4 shrink-0 text-[#718096] transition group-hover:-translate-y-0.5 group-hover:text-[#3157D5]" /></div>
        </Link>)}
      </div>
    </div>
  </section>;
}

function PackageSearchIcon() {
  return <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/80 bg-white/80 text-[#3157D5] shadow-sm"><Search className="h-7 w-7" strokeWidth={1.5} /></span>;
}

export function FeaturedProductsSection({ products }: { products: Product[] }) {
  return <section id="products" className="scroll-mt-28 py-12 sm:py-16">
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3"><SectionHeading eyebrow="مختار لك" title="منتجات تستحق اكتشافها" description="تعرّف على مجموعة مختارة من المنتجات المتاحة على Muqatshop." /><Link href="/shop" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-[#3157D5]">عرض جميع المنتجات <ArrowUpLeft className="h-4 w-4" /></Link></div>
      {products.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">{products.slice(0, 8).map((product) => <HomeProductCard key={product.id} product={product} />)}</div> : <div className="rounded-xl border border-dashed border-[#D6DDEA] bg-[#F6F8FB] px-5 py-9 text-center"><p className="font-semibold text-[#14243A]">لا توجد منتجات مميزة متاحة حاليًا.</p><p className="mt-2 text-sm text-[#718096]">يمكنك استكشاف بقية المنتجات في المتجر.</p><Link href="/shop" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#3157D5] px-4 py-2.5 text-sm font-semibold text-white">تصفح المتجر <ArrowLeft className="h-4 w-4" /></Link></div>}
    </div>
  </section>;
}

const pathways: { icon: LucideIcon; eyebrow: string; title: string; body: string; href: string; label: string; color: string; outline: string }[] = [
  { icon: ShoppingBag, eyebrow: "للعملاء", title: "تسوق بسهولة", body: "استكشف المنتجات، واختر ما يناسبك، وأكمل طلبك من خلال تجربة شراء واضحة.", href: "/shop", label: "ابدأ التسوق", color: "bg-[#3157D5]", outline: "border-[#D9E4FF]" },
  { icon: Store, eyebrow: "لأصحاب المنتجات", title: "اعرض فكرة التعاون", body: "تواصل مع Muqatshop لبحث عرض منتجاتك والوصول إلى عملاء ومسوقين جدد.", href: "mailto:muqatshop@gmail.com?subject=%D8%AA%D8%B9%D8%A7%D9%88%D9%86%20%D8%AA%D8%AC%D8%A7%D8%B1%D9%8A", label: "تواصل للتعاون", color: "bg-[#14243A]", outline: "border-[#D8E0E8]" },
  { icon: TrendingUp, eyebrow: "للمسوقين", title: "سوّق وتابع عمولتك", body: "اختر المنتجات المتاحة للتسويق، وشارك روابطك، وتابع الطلبات والعمولات من البوابة.", href: "/merchant/register", label: "انضم كمسوق", color: "bg-[#168B7D]", outline: "border-[#C8E9E4]" },
];

export function HowItWorksSection() {
  return <section id="how-it-works" className="scroll-mt-28 border-y border-[#E4E9F0] bg-white py-12 sm:py-16">
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8"><SectionHeading eyebrow="منصة واحدة" title="منصة واحدة... تربط أطراف التجارة" description="نظام متكامل يجعل عملية البيع والتسويق والشراء أكثر تنظيمًا." />
      <div className="grid gap-4 md:grid-cols-3">{pathways.map(({ icon: Icon, eyebrow, title, body, href, label, color, outline }) => <article key={eyebrow} className={`rounded-xl border ${outline} bg-white p-5 sm:p-6`}><span className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl text-white ${color}`}><Icon className="h-6 w-6" /></span><p className="text-xs font-bold text-[#718096]">{eyebrow}</p><h3 className="mt-1 text-lg font-bold text-[#14243A]">{title}</h3><p className="mt-2 min-h-[4.5rem] text-sm leading-7 text-[#718096]">{body}</p><Link href={href} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#3157D5]">{label}<ArrowUpLeft className="h-4 w-4" /></Link></article>)}</div>
    </div>
  </section>;
}

export function PartnershipSection() {
  return <section id="partners" className="scroll-mt-28 py-12 sm:py-16">
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8"><SectionHeading eyebrow="مسارات التعاون" title="لكل شريك طريقه إلى النمو" description="ابدأ بالمسار الذي يناسب دورك، وتعرّف على الأدوات المتاحة حاليًا." />
      <div className="grid overflow-hidden rounded-2xl border border-[#E4E9F0] bg-white md:grid-cols-2">
        <article className="p-6 sm:p-8 lg:p-10"><span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-[#EEF3FF] text-[#3157D5]"><Store className="h-6 w-6" /></span><p className="mt-5 text-xs font-bold text-[#3157D5]">لأصحاب المنتجات</p><h3 className="mt-2 text-xl font-bold text-[#14243A] sm:text-2xl">لديك منتجات؟ وسّع نطاق بيعك.</h3><p className="mt-3 text-sm leading-7 text-[#718096]">ابدأ بتواصل مباشر مع فريق Muqatshop لبحث فرص التعاون التجاري وعرض منتجاتك، ثم نحدد الخطوات المناسبة لطبيعة النشاط.</p><ul className="mt-5 space-y-3 text-sm text-[#526174]"><li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#21865B]" />مناقشة إمكانية إدراج المنتجات</li><li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#21865B]" />بحث فرص الوصول إلى مسوقين وعملاء</li><li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#21865B]" />تحديد تفاصيل التعاون قبل البدء</li></ul><a href="mailto:muqatshop@gmail.com?subject=%D8%AA%D8%B9%D8%A7%D9%88%D9%86%20%D8%AA%D8%AC%D8%A7%D8%B1%D9%8A" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#14243A] px-4 text-sm font-semibold text-[#14243A] transition hover:bg-[#F6F8FB]">ابدأ شراكتك كتاجر <ArrowUpLeft className="h-4 w-4" /></a></article>
        <article className="border-t border-[#E4E9F0] bg-[#F5FAF9] p-6 sm:p-8 md:border-r md:border-t-0 lg:p-10"><span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-[#DFF3EF] text-[#168B7D]"><TrendingUp className="h-6 w-6" /></span><p className="mt-5 text-xs font-bold text-[#168B7D]">للمسوقين</p><h3 className="mt-2 text-xl font-bold text-[#14243A] sm:text-2xl">حوّل مهاراتك في التسويق إلى فرصة.</h3><p className="mt-3 text-sm leading-7 text-[#718096]">أنشئ حساب مسوق، واختر المنتجات المتاحة، وشارك روابط الإحالة الخاصة بك، وتابع أداءك وعمولاتك من بوابة المسوق.</p><ul className="mt-5 space-y-3 text-sm text-[#526174]"><li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#21865B]" />كتالوج منتجات متاحة للتسويق</li><li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#21865B]" />روابط إحالة خاصة بالحساب</li><li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#21865B]" />متابعة الطلبات والعمولات</li></ul><Link href="/merchant/register" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#168B7D] px-4 text-sm font-semibold text-white transition hover:bg-[#11766B]">ابدأ كمسوق <ArrowUpLeft className="h-4 w-4" /></Link></article>
      </div>
    </div>
  </section>;
}

export function DealsSection({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return <section id="deals" className="scroll-mt-28 bg-[#F6F8FB] py-12 sm:py-16"><div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8"><SectionHeading eyebrow="خصومات متاحة" title="عروض مميزة" description="اكتشف المنتجات التي تقدم عروضًا حقيقية." /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">{products.slice(0, 4).map((product) => <HomeProductCard key={product.id} product={product} />)}</div></div></section>;
}

const benefits: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: BadgeCheck, title: "تجربة متكاملة", body: "تسوق وتجارة وتسويق من خلال منصة واحدة." },
  { icon: Package, title: "تنوع المنتجات", body: "اكتشف منتجات متاحة من مجالات مختلفة." },
  { icon: TrendingUp, title: "نظام تسويق واضح", body: "روابط إحالة وتقارير وعمولات قابلة للمتابعة." },
  { icon: ClipboardList, title: "إدارة منظمة", body: "تابع الطلبات والتعاملات من خلال نظام مركزي." },
  { icon: Handshake, title: "شراكات تجارية", body: "قنوات للتواصل بين أصحاب المنتجات والمسوقين." },
];

export function WhyUsSection() {
  return <section id="why-muqatshop" className="scroll-mt-28 py-12 sm:py-16"><div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8"><SectionHeading eyebrow="مصممة للتجارة الحديثة" title="لماذا Muqatshop؟" description="مسارات واضحة وأدوات عملية لكل طرف في تجربة التجارة." /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{benefits.map(({ icon: Icon, title, body }) => <article key={title} className="rounded-xl border border-[#E4E9F0] bg-white p-5"><span className="inline-grid h-10 w-10 place-items-center rounded-lg bg-[#F6F8FB] text-[#3157D5]"><Icon className="h-5 w-5" /></span><h3 className="mt-4 text-sm font-bold text-[#14243A]">{title}</h3><p className="mt-2 text-xs leading-6 text-[#718096]">{body}</p></article>)}</div></div></section>;
}

const merchantSteps = ["راسل فريق Muqatshop بنبذة عن النشاط.", "شارك تفاصيل المنتجات ومجالات التعاون.", "ناقش الاحتياجات والخطوات المناسبة."];
const affiliateSteps = ["أنشئ حساب مسوق وأكّد بريدك الإلكتروني.", "سجّل الدخول إلى بوابة المسوق.", "اختر المنتجات المتاحة وشارك روابطك."];

function StepList({ title, steps, tone }: { title: string; steps: string[]; tone: "blue" | "teal" }) {
  return <div className="rounded-xl border border-[#E4E9F0] bg-white p-5 sm:p-6"><h3 className="text-base font-bold text-[#14243A]">{title}</h3><ol className="mt-5 space-y-4">{steps.map((step, index) => <li key={step} className="flex gap-3"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${tone === "blue" ? "bg-[#3157D5]" : "bg-[#168B7D]"}`}>{index + 1}</span><span className="pt-1 text-sm leading-6 text-[#526174]">{step}</span></li>)}</ol></div>;
}

export function JoinSection() {
  return <section id="join" className="scroll-mt-28 bg-[#F6F8FB] py-12 sm:py-16"><div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8"><SectionHeading eyebrow="ابدأ بخطوة بسيطة" title="ابدأ رحلتك مع Muqatshop" description="اختر المسار المناسب؛ تسجيل المسوق يتم عبر البوابة الحالية، أما تعاون أصحاب المنتجات فيبدأ بالتواصل مع الفريق." /><div className="grid gap-4 md:grid-cols-2"><StepList title="لأصحاب المنتجات" steps={merchantSteps} tone="blue" /><StepList title="للمسوقين" steps={affiliateSteps} tone="teal" /></div></div></section>;
}

export function FaqSection({ config }: SectionProps) {
  if (!config.faqs.length) return null;
  return <section id="faq" className="scroll-mt-28 py-12 sm:py-16"><div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"><SectionHeading eyebrow="مساعدة سريعة" title="الأسئلة الشائعة" /><div className="space-y-3">{config.faqs.map((faq, index) => <details key={`${faq.question}-${index}`} className="home-faq rounded-xl border border-[#E4E9F0] bg-white p-4 open:border-[#C8D6FF] sm:p-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-[#14243A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3157D5]"><span>{faq.question}</span><ChevronDown className="h-4 w-4 shrink-0 text-[#718096] transition-transform" /></summary><p className="max-w-3xl pt-3 text-sm leading-7 text-[#718096]">{faq.answer}</p></details>)}</div></div></section>;
}

export function FinalCtaSection({ config }: SectionProps) {
  return <section className="px-4 pb-14 sm:px-6 sm:pb-20 lg:px-8"><div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-2xl bg-[#14243A] px-5 py-10 text-center text-white sm:px-10 sm:py-14"><span className="pointer-events-none absolute -left-12 -top-16 h-64 w-64 rounded-full border border-white/10" /><span className="pointer-events-none absolute -left-2 -top-6 h-44 w-44 rounded-full border border-white/10" /><div className="relative mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#7CE0D0]">Muqatshop</p><h2 className="mt-3 text-2xl font-bold sm:text-3xl">مكانك في عالم التجارة يبدأ من هنا.</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">سواء كنت تبحث عن منتج، أو تمتلك نشاطًا تجاريًا، أو ترغب في التسويق بالعمولة، ستجد مسارك على Muqatshop.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/shop" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-[#14243A] transition hover:bg-[#F6F8FB]">اكتشف المنتجات <ArrowLeft className="h-4 w-4" /></Link><Link href="/merchant/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/45 px-5 text-sm font-semibold text-white transition hover:bg-white/10">انضم كمسوق <ArrowUpLeft className="h-4 w-4" /></Link></div><a className="mt-4 inline-block text-xs text-white/70 underline underline-offset-4 hover:text-white" href={`mailto:${config.contactEmail}?subject=%D8%AA%D8%B9%D8%A7%D9%88%D9%86%20%D8%AA%D8%AC%D8%A7%D8%B1%D9%8A`}>للتعاون كصاحب منتجات: تواصل مع فريقنا</a></div></div></section>;
}
