export const HOME_SECTION_KEYS = [
  "hero",
  "trust",
  "categories",
  "featuredProducts",
  "howItWorks",
  "partnerships",
  "deals",
  "whyUs",
  "join",
  "faq",
  "finalCta",
] as const;

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];

export type HomeFaq = { question: string; answer: string };

export type HomepageConfig = {
  announcement: {
    enabled: boolean;
    text: string;
    href: string;
    startsAt: string;
    endsAt: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
    image: string;
  };
  sectionVisibility: Record<HomeSectionKey, boolean>;
  sectionOrder: HomeSectionKey[];
  featuredCategoryIds: string[];
  faqs: HomeFaq[];
  contactEmail: string;
};

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  announcement: {
    enabled: true,
    text: "Muqatshop تجمع لك التسوق والتجارة والتسويق في منصة واحدة.",
    href: "/shop",
    startsAt: "",
    endsAt: "",
  },
  hero: {
    eyebrow: "منصة تجارة إلكترونية متكاملة",
    title: "كل ما تحتاجه للتجارة والشراء... في مكان واحد.",
    description:
      "اكتشف منتجات متنوعة، وانضم إلى شبكة من التجار والمسوقين، وابدأ رحلتك التجارية مع Muqatshop.",
    primaryLabel: "اكتشف المنتجات",
    primaryHref: "/shop",
    secondaryLabel: "انضم إلى مجتمعنا التجاري",
    secondaryHref: "#join",
    image: "/images/muqat-home-hero.webp",
  },
  sectionVisibility: {
    hero: true,
    trust: true,
    categories: true,
    featuredProducts: true,
    howItWorks: true,
    partnerships: true,
    deals: true,
    whyUs: true,
    join: true,
    faq: true,
    finalCta: true,
  },
  sectionOrder: [...HOME_SECTION_KEYS],
  featuredCategoryIds: [],
  faqs: [
    { question: "ما هي Muqatshop؟", answer: "Muqatshop منصة للتسوق تتيح استكشاف المنتجات، وتوفر مسارًا للمسوقين للتسجيل ومتابعة أعمالهم، مع استقبال استفسارات التعاون التجاري عبر فريق المنصة." },
    { question: "كيف يمكنني شراء المنتجات؟", answer: "تصفح المتجر أو التصنيفات، اختر المنتج المتاح، ثم أضفه إلى السلة وأكمل خطوات الطلب. قد يتطلب إتمام الشراء تسجيل حساب عميل." },
    { question: "كيف أنضم كتاجر؟", answer: "مسار تسجيل أصحاب المنتجات كشركاء توريد غير متاح كلوحة ذاتية حاليًا. أرسل نبذة عن نشاطك ومنتجاتك إلى بريد الدعم لمناقشة التعاون." },
    { question: "كيف أنضم كمسوق؟", answer: "أنشئ حساب مسوق من صفحة التسجيل، وأكّد بريدك الإلكتروني، ثم سجّل الدخول إلى بوابة المسوق للاطلاع على المنتجات والروابط المتاحة." },
    { question: "كيف يتم احتساب عمولة المسوق؟", answer: "تظهر تفاصيل العمولات المرتبطة بحسابك داخل بوابة المسوق وفق إعدادات المنصة الحالية. راجع تفاصيل كل منتج أو تواصل مع الدعم عند الحاجة." },
    { question: "متى تصبح العمولة مستحقة؟", answer: "تُراجع حالة الطلب والعمولة من خلال لوحة المسوق؛ لا تُعد العمولة نهائية لمجرد إنشاء الطلب." },
    { question: "كيف تتم عملية الشحن؟", answer: "تظهر تفاصيل الشحن ضمن خطوات إتمام الطلب. تختلف المدة والتكلفة بحسب الوجهة والطلب." },
    { question: "كيف أتابع طلبي؟", answer: "استخدم صفحة تتبع الطلب وأدخل البيانات المطلوبة، أو راجع حالة الطلب من حسابك إذا كان متاحًا." },
    { question: "ماذا يحدث عند إلغاء الطلب؟", answer: "تُعالج حالة الطلب وفق مرحلته وسياسة المتجر السارية. تواصل مع الدعم إذا احتجت مساعدة بشأن طلب محدد." },
    { question: "كيف أتواصل مع الدعم؟", answer: "راسل فريق Muqatshop عبر البريد الإلكتروني الظاهر في أسفل الصفحة، مع ذكر رقم الطلب عند الاستفسار عن طلب قائم." },
  ],
  contactEmail: "muqatshop@gmail.com",
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

function text(value: unknown, fallback: string, max = 1000): string {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, max);
}

export function safeHomepageHref(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const candidate = value.trim();
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate.slice(0, 500);
  if (candidate.startsWith("#")) return candidate.slice(0, 120);
  if (candidate.toLowerCase().startsWith("mailto:")) return candidate.slice(0, 300);
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString().slice(0, 500) : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeHomepageConfig(input: unknown): HomepageConfig {
  const source = asRecord(input);
  const announcement = asRecord(source.announcement);
  const hero = asRecord(source.hero);
  const visibility = asRecord(source.sectionVisibility);
  const faqSource = Array.isArray(source.faqs) ? source.faqs : DEFAULT_HOMEPAGE_CONFIG.faqs;
  const validOrder = Array.isArray(source.sectionOrder)
    ? source.sectionOrder.filter((key): key is HomeSectionKey =>
        HOME_SECTION_KEYS.includes(key as HomeSectionKey)
      )
    : [];
  const order = [...new Set(validOrder)];
  for (const key of HOME_SECTION_KEYS) if (!order.includes(key)) order.push(key);

  return {
    announcement: {
      enabled: typeof announcement.enabled === "boolean" ? announcement.enabled : DEFAULT_HOMEPAGE_CONFIG.announcement.enabled,
      text: text(announcement.text, DEFAULT_HOMEPAGE_CONFIG.announcement.text, 250),
      href: safeHomepageHref(announcement.href, DEFAULT_HOMEPAGE_CONFIG.announcement.href),
      startsAt: text(announcement.startsAt, "", 40),
      endsAt: text(announcement.endsAt, "", 40),
    },
    hero: {
      eyebrow: text(hero.eyebrow, DEFAULT_HOMEPAGE_CONFIG.hero.eyebrow, 100),
      title: text(hero.title, DEFAULT_HOMEPAGE_CONFIG.hero.title, 180),
      description: text(hero.description, DEFAULT_HOMEPAGE_CONFIG.hero.description, 400),
      primaryLabel: text(hero.primaryLabel, DEFAULT_HOMEPAGE_CONFIG.hero.primaryLabel, 60),
      primaryHref: safeHomepageHref(hero.primaryHref, DEFAULT_HOMEPAGE_CONFIG.hero.primaryHref),
      secondaryLabel: text(hero.secondaryLabel, DEFAULT_HOMEPAGE_CONFIG.hero.secondaryLabel, 60),
      secondaryHref: safeHomepageHref(hero.secondaryHref, DEFAULT_HOMEPAGE_CONFIG.hero.secondaryHref),
      image: safeHomepageHref(hero.image, DEFAULT_HOMEPAGE_CONFIG.hero.image),
    },
    sectionVisibility: Object.fromEntries(
      HOME_SECTION_KEYS.map((key) => [key, typeof visibility[key] === "boolean" ? visibility[key] : true])
    ) as Record<HomeSectionKey, boolean>,
    sectionOrder: order,
    featuredCategoryIds: Array.isArray(source.featuredCategoryIds)
      ? source.featuredCategoryIds.filter((id): id is string => typeof id === "string" && id.length <= 80).slice(0, 20)
      : [],
    faqs: faqSource
      .slice(0, 10)
      .map((item) => {
        const row = asRecord(item);
        return {
          question: text(row.question, "", 180),
          answer: text(row.answer, "", 1200),
        };
      })
      .filter((item) => item.question && item.answer),
    contactEmail: text(source.contactEmail, DEFAULT_HOMEPAGE_CONFIG.contactEmail, 254),
  };
}

export function isAnnouncementActive(config: HomepageConfig, now = new Date()): boolean {
  if (!config.announcement.enabled || !config.announcement.text) return false;
  const start = config.announcement.startsAt ? new Date(config.announcement.startsAt) : null;
  const end = config.announcement.endsAt ? new Date(config.announcement.endsAt) : null;
  if (start && !Number.isNaN(start.getTime()) && now < start) return false;
  if (end && !Number.isNaN(end.getTime()) && now > end) return false;
  return true;
}
