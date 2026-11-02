import {
  supabase,
  isSupabaseConfigured,
  productMainImage,
  type Category,
  type Product,
} from "@/lib/supabase";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { PromoSlider, type PromoSlide } from "@/components/home/PromoSlider";
import { StoreBenefits } from "@/components/home/StoreBenefits";
import { CategoryCards } from "@/components/home/CategoryCards";
import { SectionHeader } from "@/components/home/SectionHeader";
import { HorizontalProductRail } from "@/components/home/HorizontalProductRail";
import { ProductGrid } from "@/components/home/ProductGrid";
import { RecentlyViewedSection } from "@/components/home/RecentlyViewedSection";
import { isSaleActive } from "@/lib/utils";
import {
  isCampaignEligible,
  sortCampaigns,
  toPublicCampaign,
  type CampaignRow,
} from "@/lib/campaigns";

function available(product: Product): boolean {
  if (product.variants?.length) return product.variants.some((v) => Number(v.stock) > 0);
  return Number(product.stock) > 0;
}

const PRODUCT_COLS =
  "id,name,slug,price,compare_at_price,sale_ends_at,images,main_image_index,category_id,stock,variants,is_featured,is_active,created_at";

async function loadCampaignSlides(): Promise<{
  slides: PromoSlide[];
  autoplay: boolean;
  intervalMs: number;
}> {
  if (!isSupabaseConfigured) {
    return { slides: defaultSlides(), autoplay: true, intervalMs: 5000 };
  }

  const [{ data: rows }, { data: settingsRow }] = await Promise.all([
    supabase
      .from("gallery_slides")
      .select(
        "id,name,title,subtitle,image_url,mobile_image_url,link_url,button_text,sort_order,priority,is_active,status,starts_at,ends_at,created_at,updated_at"
      )
      .order("priority", { ascending: false }),
    supabase.from("site_settings").select("value").eq("key", "gallery").maybeSingle(),
  ]);

  const settings = (settingsRow?.value as {
    enabled?: boolean;
    autoplay?: boolean;
    interval_ms?: number;
  }) || {};

  if (settings.enabled === false) {
    return { slides: [], autoplay: false, intervalMs: 5000 };
  }

  const now = new Date();
  const eligible = sortCampaigns(
    ((rows as CampaignRow[]) || []).filter((r) => isCampaignEligible(r, now))
  );

  if (eligible.length > 0) {
    return {
      slides: eligible.map((r) => {
        const p = toPublicCampaign(r);
        return {
          id: p.id,
          title: p.title,
          subtitle: p.subtitle,
          href: p.href,
          image: p.image,
          mobileImage: p.mobileImage,
          buttonText: p.buttonText,
          tone: "navy" as const,
        };
      }),
      autoplay: settings.autoplay !== false,
      intervalMs: Number(settings.interval_ms) || 5000,
    };
  }

  return {
    slides: defaultSlides(),
    autoplay: settings.autoplay !== false,
    intervalMs: Number(settings.interval_ms) || 5000,
  };
}

async function loadHomeData() {
  if (!isSupabaseConfigured) {
    return {
      categories: [] as Category[],
      bestSellers: [] as Product[],
      offers: [] as Product[],
      recommended: [] as Product[],
      categoryProducts: [] as Product[],
      campaign: { slides: defaultSlides(), autoplay: true, intervalMs: 5000 },
    };
  }

  const [categoriesResult, featuredResult, offersResult, activeResult, campaign] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id,name,slug,image,sort_order,group_id,parent_id")
        .eq("is_active", true)
        .is("parent_id", null)
        .order("sort_order", { ascending: true })
        .limit(10),
      supabase
        .from("products")
        .select(PRODUCT_COLS)
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(24),
      supabase
        .from("products")
        .select(PRODUCT_COLS)
        .eq("is_active", true)
        .not("compare_at_price", "is", null)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("products")
        .select(PRODUCT_COLS)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(48),
      loadCampaignSlides(),
    ]);

  const categories = (categoriesResult.data as Category[]) || [];
  const featured = ((featuredResult.data as Product[]) || []).filter(available);
  const offers = ((offersResult.data as Product[]) || [])
    .filter(
      (p) =>
        available(p) && isSaleActive(p.price, p.compare_at_price, p.sale_ends_at)
    )
    .slice(0, 12);
  const active = ((activeResult.data as Product[]) || []).filter(available);

  const bestSellers = (featured.length ? featured : active).slice(0, 12);

  const used = new Set(bestSellers.map((p) => p.id));
  const recommended: Product[] = active.filter((p) => !used.has(p.id)).slice(0, 8);
  if (recommended.length < 8) {
    for (const p of active) {
      if (recommended.length >= 8) break;
      if (!recommended.some((x) => x.id === p.id)) recommended.push(p);
    }
  }

  const catIds = categories.slice(0, 3).map((c) => c.id);
  let categoryProducts: Product[] = [];
  if (catIds.length) {
    const { data } = await supabase
      .from("products")
      .select(PRODUCT_COLS)
      .eq("is_active", true)
      .in("category_id", catIds)
      .order("created_at", { ascending: false })
      .limit(24);
    categoryProducts = ((data || []) as Product[])
      .filter((p) => available(p))
      .filter((p) => !used.has(p.id))
      .slice(0, 8);
  }

  return {
    categories,
    bestSellers,
    offers,
    recommended,
    categoryProducts,
    campaign,
  };
}

function defaultSlides(): PromoSlide[] {
  return [
    {
      id: "shop",
      title: "تسوق أحدث المنتجات على Muqatshop",
      subtitle: "تجربة تسوق واضحة — منتجات حقيقية وأسعار من المتجر.",
      href: "/shop",
      tone: "navy",
      buttonText: "تسوق الآن",
    },
    {
      id: "categories",
      title: "تصفح التصنيفات",
      subtitle: "اعثر على ما تبحث عنه بسرعة.",
      href: "/categories",
      tone: "blue",
      buttonText: "التصنيفات",
    },
    {
      id: "offers",
      title: "اكتشف العروض السارية",
      subtitle: "نعرض فقط المنتجات ذات الخصم الحقيقي.",
      href: "/shop",
      tone: "teal",
      buttonText: "العروض",
    },
  ];
}

export default async function StoreHomePage() {
  const data = await loadHomeData();

  return (
    <div className="muqat-home" dir="rtl">
      <Header />
      <main id="main-content" className="pb-20 md:pb-0">
        <PromoSlider
          slides={data.campaign.slides}
          autoplay={data.campaign.autoplay}
          intervalMs={data.campaign.intervalMs}
        />
        <StoreBenefits />

        {data.categories.length > 0 && (
          <section className="home-section" aria-label="التصنيفات">
            <div className="home-container">
              <SectionHeader title="التصنيفات" href="/categories" />
              <CategoryCards categories={data.categories} />
            </div>
          </section>
        )}

        {data.bestSellers.length > 0 && (
          <section className="home-section" aria-label="الأكثر مبيعًا">
            <div className="home-container">
              <SectionHeader
                title="الأكثر مبيعًا"
                description="منتجات مميزة ونشطة من المتجر"
                href="/shop"
              />
              <HorizontalProductRail products={data.bestSellers} />
            </div>
          </section>
        )}

        {data.offers.length > 0 && (
          <section className="home-section" aria-label="العروض">
            <div className="home-container">
              <SectionHeader title="العروض" description="خصومات سارية فقط" href="/shop" />
              <ProductGrid products={data.offers} />
            </div>
          </section>
        )}

        {data.recommended.length > 0 && (
          <section className="home-section" aria-label="مقترحة لك">
            <div className="home-container">
              <SectionHeader title="مقترحة لك" href="/shop" />
              <HorizontalProductRail products={data.recommended} />
            </div>
          </section>
        )}

        {data.categoryProducts.length > 0 && (
          <section className="home-section" aria-label="منتجات التصنيفات">
            <div className="home-container">
              <SectionHeader title="من التصنيفات" href="/categories" />
              <ProductGrid products={data.categoryProducts} />
            </div>
          </section>
        )}

        <RecentlyViewedSection />

        <StoreBenefits />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
