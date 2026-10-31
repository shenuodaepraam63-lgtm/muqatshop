import type { Metadata } from "next";
import { Fragment } from "react";
import { supabase, isSupabaseConfigured, type Category, type Product } from "@/lib/supabase";
import { DEFAULT_HOMEPAGE_CONFIG, isAnnouncementActive, normalizeHomepageConfig, type HomeSectionKey } from "@/lib/homepage-config";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import { CategorySection, DealsSection, FaqSection, FeaturedProductsSection, FinalCtaSection, HomeHero, HowItWorksSection, JoinSection, PartnershipSection, TrustSection, WhyUsSection } from "@/components/home/HomeSections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://muqatshop.vercel.app"),
  title: "Muqatshop | منصة للتسوق والتجارة والتسويق بالعمولة",
  description: "اكتشف Muqatshop، منصة تجمع العملاء والتجار والمسوقين في تجربة تجارة إلكترونية متكاملة. تصفح المنتجات، وانضم كشريك تجاري أو مسوق.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Muqatshop",
    description: "منصة تجارة إلكترونية متكاملة.",
    url: "https://muqatshop.vercel.app/",
    locale: "ar_EG",
    type: "website",
    images: [{ url: "/images/muqat-home-og.webp", width: 1200, height: 630, alt: "Muqatshop — منصة للتسوق والتجارة والتسويق" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Muqatshop",
    description: "منصة تجارة إلكترونية متكاملة.",
    images: ["/images/muqat-home-og.webp"],
  },
};

function available(product: Product): boolean {
  if (product.variants?.length) return product.variants.some((variant) => Number(variant.stock) > 0);
  return Number(product.stock) > 0;
}

async function loadHomepage() {
  if (!isSupabaseConfigured) {
    return { config: DEFAULT_HOMEPAGE_CONFIG, featuredProducts: [] as Product[], deals: [] as Product[], categories: [] as Category[], hadProductError: false, hadCategoryError: false };
  }

  const productColumns = "id,name,slug,price,compare_at_price,sale_ends_at,images,main_image_index,category_id,stock,variants,is_featured,is_active,created_at";
  const [settingsResult, featuredResult, dealsResult, categoriesResult] = await Promise.all([
    supabase.from("site_settings").select("value").eq("key", "homepage").maybeSingle(),
    supabase.from("products")
      .select(productColumns)
      .eq("is_active", true)
      .eq("is_featured", true)
      .or("stock.gt.0,variants.not.is.null")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("products")
      .select(productColumns)
      .eq("is_active", true)
      .not("compare_at_price", "is", null)
      .or("stock.gt.0,variants.not.is.null")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("categories")
      .select("id,name,slug,image,sort_order,group_id,parent_id")
      .eq("is_active", true)
      .is("parent_id", null)
      .order("sort_order", { ascending: true })
      .limit(50),
  ]);

  const config = normalizeHomepageConfig(settingsResult.data?.value);
  const featuredProducts = ((featuredResult.data || []) as Product[]).filter((product) => product.is_active && product.is_featured && available(product)).slice(0, 8);
  const deals = ((dealsResult.data || []) as Product[]).filter((product) => {
    const compare = Number(product.compare_at_price || 0);
    const price = Number(product.price || 0);
    const endIsValid = !product.sale_ends_at || new Date(product.sale_ends_at).getTime() > Date.now();
    return product.is_active && available(product) && compare > price && endIsValid;
  }).slice(0, 4);
  const allCategories = (categoriesResult.data || []) as Category[];
  const categories = config.featuredCategoryIds.length
    ? config.featuredCategoryIds.map((id) => allCategories.find((item) => item.id === id)).filter((item): item is Category => Boolean(item))
    : allCategories.slice(0, 10);

  return {
    config,
    featuredProducts,
    deals,
    categories,
    hadProductError: Boolean(featuredResult.error || dealsResult.error),
    hadCategoryError: Boolean(categoriesResult.error),
  };
}

export default async function HomePage() {
  const { config, featuredProducts, deals, categories, hadProductError, hadCategoryError } = await loadHomepage();

  const content: Record<HomeSectionKey, React.ReactNode> = {
    hero: <HomeHero config={config} />,
    trust: <TrustSection />,
    categories: hadCategoryError ? <CategoryLoadError /> : <CategorySection categories={categories} />,
    featuredProducts: hadProductError ? <ProductLoadError /> : <FeaturedProductsSection products={featuredProducts} />,
    howItWorks: <HowItWorksSection />,
    partnerships: <PartnershipSection />,
    deals: <DealsSection products={deals} />,
    whyUs: <WhyUsSection />,
    join: <JoinSection />,
    faq: <FaqSection config={config} />,
    finalCta: <FinalCtaSection config={config} />,
  };

  const announcementVisible = isAnnouncementActive(config);

  return <div className="muqat-home" dir="rtl">
    {announcementVisible && <div className="home-announcement" role="region" aria-label="إعلان"><a href={config.announcement.href} className="mx-auto block max-w-[1280px] px-4 py-2 text-center text-xs font-semibold text-white sm:text-[13px]">{config.announcement.text}</a></div>}
    <HomeHeader categories={categories} />
    <main id="main-content">
      {config.sectionOrder.map((key) => {
        if (!config.sectionVisibility[key]) return null;
        if (key === "categories" && categories.length === 0) return null;
        if (key === "deals" && deals.length === 0) return null;
        return <Fragment key={key}>{content[key]}</Fragment>;
      })}
    </main>
    <HomeFooter email={config.contactEmail} />
  </div>;
}

function CategoryLoadError() {
  return <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8" aria-live="polite"><p className="rounded-xl border border-[#E4E9F0] bg-[#F6F8FB] p-4 text-sm text-[#718096]">تعذر تحميل التصنيفات حاليًا، لكن بقية الصفحة متاحة.</p></section>;
}

function ProductLoadError() {
  return <section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8" aria-live="polite"><div className="rounded-xl border border-[#E4E9F0] bg-[#F6F8FB] p-5 text-center"><p className="text-sm text-[#718096]">تعذر تحميل المنتجات حاليًا. حاول مرة أخرى.</p><a href="/shop" className="mt-3 inline-flex rounded-lg bg-[#3157D5] px-4 py-2 text-sm font-semibold text-white">فتح المتجر</a></div></section>;
}
