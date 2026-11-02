"use client";

/**
 * Motion-enhanced marketing homepage sections.
 * Server MarketingHomePage still fetches data; these components receive props.
 */

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpLeft,
  CheckCircle2,
  ClipboardList,
  Handshake,
  Package,
  Search,
  ShoppingBag,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { Category, Product } from "@/lib/supabase";
import type { HomepageConfig } from "@/lib/homepage-config";
import { HomeProductCard } from "@/components/home/HomeProductCard";
import {
  fadeInUp,
  heroText,
  heroVisual,
  staggerContainer,
  staggerItem,
} from "@/lib/animations/motion-variants";
import {
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_STAGGER,
  MOTION_STAGGER_MAX,
} from "@/lib/animations/motion-config";

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-7 max-w-2xl">
      {eyebrow && (
        <p className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-[#3157D5]">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-bold leading-tight text-[#14243A] sm:text-3xl">{title}</h2>
      {description && (
        <p className="mt-3 text-sm leading-7 text-[#718096] sm:text-base">{description}</p>
      )}
    </div>
  );
}

export function HomeHero({ config }: { config: HomepageConfig }) {
  const reduce = useReducedMotion();

  return (
    <section className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 pb-10 pt-10 sm:px-6 md:gap-10 md:pb-16 md:pt-16 lg:grid-cols-[1fr_.92fr] lg:px-8 lg:gap-14">
      <motion.div
        className="order-1 max-w-2xl"
        initial={reduce ? false : "hidden"}
        animate="visible"
        variants={staggerContainer}
      >
        <motion.p
          variants={heroText}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D9E4FF] bg-white px-3 py-1.5 text-xs font-bold text-[#3157D5]"
        >
          <span className="h-2 w-2 rounded-full bg-[#18A999]" />
          {config.hero.eyebrow}
        </motion.p>
        <motion.h1
          variants={heroText}
          className="max-w-[14ch] text-3xl font-bold leading-[1.35] text-[#14243A] sm:text-4xl lg:text-[3.25rem]"
        >
          {config.hero.title}
        </motion.h1>
        <motion.p
          variants={heroText}
          className="mt-5 max-w-xl text-base leading-8 text-[#526174] sm:text-lg"
        >
          {config.hero.description}
        </motion.p>
        <motion.div variants={heroText} className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={config.hero.primaryHref}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#3157D5] px-6 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#2447B8]"
          >
            {config.hero.primaryLabel}
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link
            href={config.hero.secondaryHref}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#14243A] bg-white px-6 text-sm font-semibold text-[#14243A] transition hover:bg-[#F6F8FB]"
          >
            {config.hero.secondaryLabel}
            <ArrowUpLeft className="h-4 w-4" />
          </Link>
        </motion.div>
        <motion.div
          variants={heroText}
          className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-[#718096]"
        >
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#21865B]" />
            تجربة شراء منظمة
          </span>
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#21865B]" />
            مسار واضح للمسوقين
          </span>
        </motion.div>
      </motion.div>

      <motion.div
        className="order-2 relative mx-auto aspect-[4/3] w-full max-w-[620px] overflow-hidden rounded-2xl border border-[#E4E9F0] bg-[#F6F8FB] shadow-[0_24px_60px_rgba(20,36,58,.08)]"
        initial={reduce ? false : "hidden"}
        animate="visible"
        variants={heroVisual}
      >
        {config.hero.image ? (
          <Image
            src={config.hero.image}
            alt="منتجات متنوعة تمثل تجربة Muqatshop التجارية"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 48vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <ShoppingBag className="h-16 w-16 text-[#3157D5]" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#14243A]/10 to-transparent" />
      </motion.div>
    </section>
  );
}

const trustItems: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: string;
}[] = [
  {
    icon: Package,
    title: "منتجات متنوعة",
    description: "اكتشف منتجات من مجالات مختلفة.",
    tone: "bg-[#EEF3FF] text-[#3157D5]",
  },
  {
    icon: Handshake,
    title: "شراكات تجارية",
    description: "تواصل مع شبكة من أصحاب المنتجات.",
    tone: "bg-[#EFF8F6] text-[#168B7D]",
  },
  {
    icon: TrendingUp,
    title: "فرص للمسوقين",
    description: "سوّق المنتجات المتاحة وتابع عمولتك.",
    tone: "bg-[#EEF3FF] text-[#3157D5]",
  },
  {
    icon: ClipboardList,
    title: "تجربة منظمة",
    description: "تابع الطلبات والعمليات من منصة واحدة.",
    tone: "bg-[#EFF8F6] text-[#168B7D]",
  },
];

export function TrustSection() {
  const reduce = useReducedMotion();
  return (
    <motion.section
      className="mx-auto max-w-[1280px] px-4 pb-10 sm:px-6 lg:px-8"
      initial={reduce ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={staggerContainer}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {trustItems.map(({ icon: Icon, title, description, tone }) => (
          <motion.article
            key={title}
            variants={staggerItem}
            className="rounded-xl border border-[#E4E9F0] bg-white p-4 sm:p-5"
          >
            <span className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="text-sm font-bold text-[#14243A] sm:text-base">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-[#718096] sm:text-sm">{description}</p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}

export function CategorySection({ categories }: { categories: Category[] }) {
  const reduce = useReducedMotion();
  if (!categories.length) return null;

  return (
    <motion.section
      id="categories"
      className="scroll-mt-28 bg-[#F6F8FB] py-12 sm:py-16"
      initial={reduce ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      variants={staggerContainer}
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeading
            eyebrow="اختياراتك"
            title="اكتشف المنتجات حسب التصنيف"
            description="تصفح مجموعات المنتجات واعثر على ما تبحث عنه بسهولة."
          />
          <Link
            href="/categories"
            className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-[#3157D5]"
          >
            كل التصنيفات <ArrowUpLeft className="h-4 w-4" />
          </Link>
        </motion.div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: MOTION_DURATION.medium,
                ease: MOTION_EASE.standard,
                delay: reduce ? 0 : Math.min(index, MOTION_STAGGER_MAX) * MOTION_STAGGER.normal,
              }}
            >
              <Link
                href={`/categories/${encodeURIComponent(category.slug)}`}
                className="group overflow-hidden rounded-xl border border-[#E4E9F0] bg-white transition duration-200 hover:-translate-y-[3px] hover:shadow-md"
              >
                <div
                  className={`relative grid aspect-[4/3] place-items-center overflow-hidden ${
                    index % 3 === 0
                      ? "bg-[#EEF3FF]"
                      : index % 3 === 1
                        ? "bg-[#EFF8F6]"
                        : "bg-[#F2F5F9]"
                  }`}
                >
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 20vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/80 bg-white/80 text-[#3157D5] shadow-sm">
                      <Search className="h-7 w-7" strokeWidth={1.5} />
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#14243A]/[.07] to-transparent" />
                </div>
                <div className="flex min-h-14 items-center justify-between gap-2 px-3 py-3">
                  <span className="line-clamp-2 text-sm font-semibold text-[#202B3C]">
                    {category.name}
                  </span>
                  <ArrowUpLeft className="h-4 w-4 shrink-0 text-[#718096] transition group-hover:-translate-y-0.5 group-hover:text-[#3157D5]" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export function FeaturedProductsSection({ products }: { products: Product[] }) {
  const reduce = useReducedMotion();

  return (
    <motion.section
      id="products"
      className="scroll-mt-28 py-12 sm:py-16"
      initial={reduce ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={staggerContainer}
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeading
            eyebrow="مختار لك"
            title="منتجات تستحق اكتشافها"
            description="تعرّف على مجموعة مختارة من المنتجات المتاحة على Muqatshop."
          />
          <Link href="/shop" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-[#3157D5]">
            عرض جميع المنتجات <ArrowUpLeft className="h-4 w-4" />
          </Link>
        </motion.div>
        {products.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {products.slice(0, 8).map((product, i) => (
              <motion.div
                key={product.id}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{
                  duration: MOTION_DURATION.medium,
                  ease: MOTION_EASE.standard,
                  delay: reduce ? 0 : Math.min(i, MOTION_STAGGER_MAX) * MOTION_STAGGER.normal,
                }}
              >
                <HomeProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#D6DDEA] bg-[#F6F8FB] px-5 py-9 text-center">
            <p className="font-semibold text-[#14243A]">لا توجد منتجات مميزة متاحة حاليًا.</p>
            <p className="mt-2 text-sm text-[#718096]">يمكنك استكشاف بقية المنتجات في المتجر.</p>
            <Link
              href="/shop"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#3157D5] px-4 py-2.5 text-sm font-semibold text-white"
            >
              تصفح المتجر <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </motion.section>
  );
}
