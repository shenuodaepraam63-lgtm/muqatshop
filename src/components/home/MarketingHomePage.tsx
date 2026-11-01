import {
  supabase,
  isSupabaseConfigured,
  type Category,
  type Product,
} from "@/lib/supabase";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  isAnnouncementActive,
  normalizeHomepageConfig,
  type HomepageConfig,
  type HomeSectionKey,
} from "@/lib/homepage-config";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import {
  CategorySection,
  DealsSection,
  FaqSection,
  FeaturedProductsSection,
  FinalCtaSection,
  HomeHero,
  HowItWorksSection,
  JoinSection,
  PartnershipSection,
  TrustSection,
  WhyUsSection,
} from "@/components/home/HomeSections";
import Link from "next/link";

const PRODUCT_COLS =
  "id,name,slug,price,compare_at_price,sale_ends_at,images,main_image_index,category_id,stock,variants,is_featured,is_active,created_at";

async function loadMarketingData(): Promise<{
  config: HomepageConfig;
  categories: Category[];
  featured: Product[];
  deals: Product[];
}> {
  if (!isSupabaseConfigured) {
    return {
      config: DEFAULT_HOMEPAGE_CONFIG,
      categories: [],
      featured: [],
      deals: [],
    };
  }

  const [settingsRes, categoriesRes, featuredRes, dealsRes] = await Promise.all([
    supabase.from("site_settings").select("value").eq("key", "homepage").maybeSingle(),
    supabase
      .from("categories")
      .select("id,name,slug,image,sort_order,group_id,parent_id")
      .eq("is_active", true)
      .is("parent_id", null)
      .order("sort_order", { ascending: true })
      .limit(12),
    supabase
      .from("products")
      .select(PRODUCT_COLS)
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("products")
      .select(PRODUCT_COLS)
      .eq("is_active", true)
      .not("compare_at_price", "is", null)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  return {
    config: normalizeHomepageConfig(settingsRes.data?.value),
    categories: (categoriesRes.data as Category[]) || [],
    featured: (featuredRes.data as Product[]) || [],
    deals: (dealsRes.data as Product[]) || [],
  };
}

/** Existing platform intro / marketing homepage (sections already in repo). */
export default async function MarketingHomePage() {
  const { config, categories, featured, deals } = await loadMarketingData();
  const showAnnouncement = isAnnouncementActive(config);

  const renderSection = (key: HomeSectionKey) => {
    if (!config.sectionVisibility[key]) return null;
    switch (key) {
      case "hero":
        return <HomeHero key={key} config={config} />;
      case "trust":
        return <TrustSection key={key} />;
      case "categories":
        return categories.length > 0 ? (
          <CategorySection key={key} categories={categories} />
        ) : null;
      case "featuredProducts":
        return featured.length > 0 ? (
          <FeaturedProductsSection key={key} products={featured} />
        ) : null;
      case "howItWorks":
        return <HowItWorksSection key={key} />;
      case "partnerships":
        return <PartnershipSection key={key} />;
      case "deals":
        return deals.length > 0 ? <DealsSection key={key} products={deals} /> : null;
      case "whyUs":
        return <WhyUsSection key={key} />;
      case "join":
        return <JoinSection key={key} />;
      case "faq":
        return <FaqSection key={key} config={config} />;
      case "finalCta":
        return <FinalCtaSection key={key} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#14243A]" dir="rtl">
      {showAnnouncement && (
        <div className="border-b border-[#D9E4FF] bg-[#EEF3FF]">
          <div className="mx-auto flex max-w-[1280px] items-center justify-center gap-3 px-4 py-2.5 text-center text-sm text-[#3157D5] sm:px-6">
            <span>{config.announcement.text}</span>
            {config.announcement.href && (
              <Link
                href={config.announcement.href}
                className="font-bold underline-offset-2 hover:underline"
              >
                المزيد
              </Link>
            )}
          </div>
        </div>
      )}
      <HomeHeader categories={categories} />
      <main id="main-content">{config.sectionOrder.map((key) => renderSection(key))}</main>
      <HomeFooter email={config.contactEmail} />
    </div>
  );
}
