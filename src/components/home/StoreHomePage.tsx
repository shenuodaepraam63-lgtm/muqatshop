import {
  supabase,
  isSupabaseConfigured,
  type Category,
  type Product,
  collectCategoryIdsWithDescendants,
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
    // Columns may not exist until SQL migration — fallback without offer fields
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

  const now = new Date();
  const eligible = sortCampaigns(
    (rows || []).filter((r) => isCampaignEligible(r, now))
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

  const [{ data: allCats }, { data: activeProducts }] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name,slug,image,sort_order,group_id,parent_id")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select(PRODUCT_COLS)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const cats = (allCats as Category[]) || [];
  const products = ((activeProducts as Product[]) || []).filter(available);
  const roots = cats.filter((c) => !c.parent_id).slice(0, 10);

  const shelves: CategoryShelfData[] = [];

  for (const root of roots) {
    const treeIds = new Set(
      collectCategoryIdsWithDescendants(
        root.id,
        cats.map((c) => ({ id: c.id, parent_id: c.parent_id }))
      )
    );
    const groupProducts = products
      .filter((p) => p.category_id && treeIds.has(p.category_id))
      .slice(0, 16);

    if (!groupProducts.length) continue;

    const subs = cats
      .filter((c) => c.parent_id === root.id)
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

    shelves.push({
      id: root.id,
      name: root.name,
      slug: root.slug,
      href: `/categories/${encodeURIComponent(root.slug)}`,
      subcategories: subs,
      products: groupProducts,
    });
  }

  return { roots: roots.slice(0, 24), shelves };
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

        {data.roots.length > 0 && (
          <section className="home-section" aria-label="التصنيفات">
            <div className="home-container">
              <SectionHeader title="التصنيفات" href="/categories" />
              <CategoryCards categories={data.roots} />
            </div>
          </section>
        )}

        <StoreBenefits />

        {data.shelves.map((shelf) => (
          <CategoryProductShelf key={shelf.id} shelf={shelf} />
        ))}

        {data.shelves.length === 0 && (
          <section className="home-section">
            <div className="home-container">
              <p className="rounded-2xl border border-dashed border-[#E4E9F0] bg-white py-12 text-center text-sm text-[#718096]">
                لا توجد منتجات مرتبطة بالتصنيفات بعد. أضف منتجات من لوحة التحكم.
              </p>
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
