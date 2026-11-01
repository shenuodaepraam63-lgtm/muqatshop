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

function available(product: Product): boolean {
  if (product.variants?.length) return product.variants.some((v) => Number(v.stock) > 0);
  return Number(product.stock) > 0;
}

const PRODUCT_COLS =
  "id,name,slug,price,compare_at_price,sale_ends_at,images,main_image_index,category_id,stock,variants,is_featured,is_active,created_at";

async function loadHomeData() {
  if (!isSupabaseConfigured) {
    return {
      categories: [] as Category[],
      bestSellers: [] as Product[],
      offers: [] as Product[],
      recommended: [] as Product[],
      categoryProducts: [] as Product[],
      slides: defaultSlides(),
    };
  }

  const [categoriesResult, featuredResult, offersResult, activeResult] = await Promise.all([
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
  const recommended: Product[] = active
    .filter((p) => !used.has(p.id))
    .slice(0, 8);
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

  const slides: PromoSlide[] = defaultSlides(
    categories[0]
      ? {
          title: categories[0].name,
          href: `/categories/${encodeURIComponent(categories[0].slug)}`,
          image: categories[0].image,
        }
      : undefined,
    offers[0]
      ? {
          title: offers[0].name,
          href: `/products/${encodeURIComponent(offers[0].slug)}`,
          image: productMainImage(offers[0]),
        }
      : undefined
  );

  return { categories, bestSellers, offers, recommended, categoryProducts, slides };
}

function defaultSlides(
  cat?: { title: string; href: string; image?: string | null },
  offer?: { title: string; href: string; image?: string | null }
): PromoSlide[] {
  return [
    {
      id: "shop",
      title: "تسوق أحدث المنتجات على Muqatshop",
      subtitle: "تجربة تسوق واضحة — منتجات حقيقية وأسعار من المتجر.",
      href: "/shop",
      tone: "navy",
    },
    cat
      ? {
          id: "cat",
          title: `استكشف تصنيف ${cat.title}`,
          subtitle: "تصفح المنتجات حسب التصنيف المناسب لك.",
          href: cat.href,
          image: cat.image,
          tone: "blue",
        }
      : {
          id: "categories",
          title: "تصفح التصنيفات",
          subtitle: "اعثر على ما تبحث عنه بسرعة.",
          href: "/categories",
          tone: "blue",
        },
    offer
      ? {
          id: "offer",
          title: `عرض: ${offer.title}`,
          subtitle: "خصم ساري على المنتج — التفاصيل داخل صفحة المنتج.",
          href: offer.href,
          image: offer.image,
          tone: "teal",
        }
      : {
          id: "offers",
          title: "اكتشف العروض السارية",
          subtitle: "نعرض فقط المنتجات ذات الخصم الحقيقي.",
          href: "/shop",
          tone: "teal",
        },
  ];
}

/** Current storefront homepage (unchanged). */
export default async function StoreHomePage() {
  const data = await loadHomeData();

  return (
    <div className="muqat-home" dir="rtl">
      <Header />
      <main id="main-content" className="pb-20 md:pb-0">
        <PromoSlider slides={data.slides} />
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
