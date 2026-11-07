import {
  supabase,
  isSupabaseConfigured,
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
import {
  CategoryProductShelf,
  type CategoryShelfData,
} from "@/components/home/CategoryProductShelf";
import { RecentlyViewedSection } from "@/components/home/RecentlyViewedSection";
import { TopPromoBar } from "@/components/home/TopPromoBar";
import { HomeMarquee } from "@/components/home/HomeMarquee";
import {
  isCampaignEligible,
  productSlugFromHref,
  sanitizeCampaignHref,
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

const CAMPAIGN_COLS =
  "id,name,title,subtitle,image_url,mobile_image_url,link_url,button_text,sort_order,priority,is_active,status,starts_at,ends_at,created_at,updated_at,offer_price,offer_compare_price,duration_label";

async function loadCampaignSlides(): Promise<{
  slides: PromoSlide[];
  autoplay: boolean;
  intervalMs: number;
}> {
  if (!isSupabaseConfigured) {
    return { slides: defaultSlides(), autoplay: true, intervalMs: 5000 };
  }

  let rows: CampaignRow[] | null = null;

  const primary = await supabase
    .from("gallery_slides")
    .select(CAMPAIGN_COLS)
    .order("priority", { ascending: false });

  if (primary.error) {
    const fallback = await supabase
      .from("gallery_slides")
      .select(
        "id,name,title,subtitle,image_url,mobile_image_url,link_url,button_text,sort_order,priority,is_active,status,starts_at,ends_at,created_at,updated_at"
      )
      .order("priority", { ascending: false });
    rows = (fallback.data as CampaignRow[]) || [];
  } else {
    rows = (primary.data as CampaignRow[]) || [];
  }

  const { data: settingsRow } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "gallery")
    .maybeSingle();

  const settings = (settingsRow?.value as {
    enabled?: boolean;
    autoplay?: boolean;
    interval_ms?: number;
  }) || {};

  if (settings.enabled === false) {
    return { slides: [], autoplay: false, intervalMs: 5000 };
  }

  const eligible = sortCampaigns(
    (rows || []).filter((r) => isCampaignEligible(r, new Date()))
  );

  if (eligible.length > 0) {
    const slugs = eligible
      .map((r) => productSlugFromHref(sanitizeCampaignHref(r.link_url)))
      .filter((s): s is string => Boolean(s));

    const priceBySlug = new Map<
      string,
      { price: number; compare_at_price: number | null }
    >();

    if (slugs.length) {
      const { data: prods } = await supabase
        .from("products")
        .select("slug,price,compare_at_price")
        .in("slug", slugs)
        .eq("is_active", true);
      for (const p of prods || []) {
        priceBySlug.set(p.slug, {
          price: Number(p.price),
          compare_at_price:
            p.compare_at_price == null ? null : Number(p.compare_at_price),
        });
      }
    }

    return {
      slides: eligible.map((r) => {
        const href = sanitizeCampaignHref(r.link_url);
        const slug = productSlugFromHref(href);
        const product = slug ? priceBySlug.get(slug) : null;
        const p = toPublicCampaign(r, product);
        return {
          id: p.id,
          title: p.title,
          subtitle: p.subtitle,
          href: p.href,
          image: p.image,
          mobileImage: p.mobileImage,
          buttonText: p.buttonText,
          tone: "navy" as const,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          endsLabel: p.endsLabel,
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

async function loadCategoryShelves(): Promise<{
  roots: Category[];
  shelves: CategoryShelfData[];
}> {
  if (!isSupabaseConfigured) return { roots: [], shelves: [] };

  const { data: allCats, error: categoriesError } = await supabase
    .from("categories")
    .select("id,name,slug,image,sort_order,group_id,parent_id")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (categoriesError) {
    console.error("Failed to load homepage categories:", categoriesError);
    return { roots: [], shelves: [] };
  }

  const cats = (allCats as Category[]) || [];
  const allProducts: Product[] = [];
  const pageSize = 500;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_COLS)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Failed to load homepage products:", error);
      break;
    }

    const page = (data as Product[]) || [];
    allProducts.push(...page);
    if (page.length < pageSize) break;
  }

  const products = allProducts.filter(available);
  const productsByCategory = new Map<string, Product[]>();

  for (const product of products) {
    if (!product.category_id) continue;
    const current = productsByCategory.get(product.category_id) || [];
    current.push(product);
    productsByCategory.set(product.category_id, current);
  }

  const categoriesWithProducts = cats.filter((category) =>
    productsByCategory.has(category.id)
  );

  const shelves: CategoryShelfData[] = categoriesWithProducts.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    href: `/categories/${encodeURIComponent(category.slug)}`,
    subcategories: [],
    products: (productsByCategory.get(category.id) || []).slice(0, 16),
  }));

  return { roots: categoriesWithProducts, shelves };
}

async function loadHomeData() {
  if (!isSupabaseConfigured) {
    return {
      roots: [] as Category[],
      shelves: [] as CategoryShelfData[],
      campaign: { slides: defaultSlides(), autoplay: true, intervalMs: 5000 },
    };
  }

  const [campaign, shelfData] = await Promise.all([
    loadCampaignSlides(),
    loadCategoryShelves(),
  ]);

  return {
    roots: shelfData.roots,
    shelves: shelfData.shelves,
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
      href: "/shop",
      tone: "blue",
      buttonText: "التصنيفات",
    },
    {
      id: "offers",
      title: "اكتشف العروض السارية",
      subtitle: "نعرض فقط المنتجات ذات الخصم الحقيقي.",
      href: "/shop?offers=true",
      tone: "teal",
      buttonText: "العروض",
    },
  ];
}

export default async function StoreHomePage() {
  const data = await loadHomeData();

  return (
    <div className="muqat-home muqat-home--marketplace" dir="rtl">
      <TopPromoBar />
      <Header />
      <main id="main-content" className="pb-20 md:pb-0">
        <PromoSlider
          slides={data.campaign.slides}
          autoplay={data.campaign.autoplay}
          intervalMs={data.campaign.intervalMs}
        />

        <HomeMarquee />

        {data.roots.length > 0 && (
          <section className="home-section store-category-section" aria-label="التصنيفات">
            <div className="home-container">
              <SectionHeader title="تسوّق حسب التصنيف" href="/shop" />
              <CategoryCards categories={data.roots} />
            </div>
          </section>
        )}

        <StoreBenefits />

        {data.shelves.length > 0 ? (
          <div className="store-shelves">
            {data.shelves.map((shelf) => (
              <CategoryProductShelf key={shelf.id} shelf={shelf} />
            ))}
          </div>
        ) : (
          <section className="home-section">
            <div className="home-container">
              <p className="rounded-2xl border border-dashed border-[#d8dfeb] bg-white py-12 text-center text-sm text-[#718096]">
                لا توجد منتجات مرتبطة بالتصنيفات بعد. أضف منتجات من لوحة التحكم.
              </p>
            </div>
          </section>
        )}

        <RecentlyViewedSection />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
