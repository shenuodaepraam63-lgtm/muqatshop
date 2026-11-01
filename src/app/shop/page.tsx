import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { fetchShopCatalog, SHOP_PAGE_SIZE } from "@/lib/shop-query";
import { ShopView } from "@/components/shop/ShopView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "المتجر | Muqatshop",
  description: "تصفح منتجات Muqatshop مع البحث والتصنيفات والعروض والفلاتر في تجربة واحدة.",
};

type Sp = {
  q?: string;
  category?: string;
  subcategory?: string;
  offers?: string;
  sort?: string;
  stock?: string;
  min?: string;
  max?: string;
  page?: string;
  type?: string;
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Sp>;
}) {
  const sp = await searchParams;

  const q = (sp.q || "").trim();
  const categorySlug = (sp.category || "").trim();
  const subcategorySlug = (sp.subcategory || "").trim();
  const offers = sp.offers === "true" || sp.offers === "1";
  const sort = sp.sort || "new";
  const stock = sp.stock === "in" ? "in" : undefined;
  const minPrice = sp.min != null && sp.min !== "" ? Number(sp.min) : null;
  const maxPrice = sp.max != null && sp.max !== "" ? Number(sp.max) : null;
  const pageNum = Math.max(1, parseInt(sp.page || "1", 10) || 1);

  // Keep select to columns that exist in current schema (image optional)
  const { data: catRows } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, image")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const categories = (catRows || []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    slug: c.slug as string,
    parent_id: (c.parent_id as string | null) || null,
    image: (c.image as string | null) || null,
    description: null as string | null,
  }));

  let categoryId: string | null = null;
  let title = "المتجر";
  let subtitle = "اكتشف المنتجات والتصنيفات والعروض في مكان واحد.";
  let resolvedCategorySlug = categorySlug;

  if (subcategorySlug) {
    const sub = categories.find((c) => c.slug === subcategorySlug);
    if (sub) {
      const parent = categories.find((c) => c.id === sub.parent_id);
      if (parent) {
        resolvedCategorySlug = parent.slug;
        categoryId = sub.id;
        title = sub.name;
        subtitle = parent.name;
      } else {
        categoryId = sub.id;
        resolvedCategorySlug = sub.slug;
        title = sub.name;
      }
    }
  } else if (categorySlug) {
    const cat = categories.find((c) => c.slug === categorySlug && !c.parent_id);
    if (cat) {
      categoryId = cat.id;
      title = cat.name;
      subtitle = "منتجات التصنيف";
    } else {
      resolvedCategorySlug = "";
    }
  }

  if (offers && !categoryId) {
    title = "العروض";
    subtitle = "منتجات بخصم ساري فقط";
  }
  if (q) {
    title = "نتائج البحث";
    subtitle = `عن: ${q}`;
  }

  const catalog = await fetchShopCatalog({
    categoryId,
    includeDescendants: Boolean(categoryId && !subcategorySlug),
    q: q || null,
    sort,
    stock,
    offers,
    minPrice: minPrice != null && !Number.isNaN(minPrice) ? minPrice : null,
    maxPrice: maxPrice != null && !Number.isNaN(maxPrice) ? maxPrice : null,
    page: pageNum,
    pageSize: SHOP_PAGE_SIZE,
    type: sp.type && sp.type !== "all" ? sp.type : null,
  });

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-[#718096]">
          جاري تحميل المتجر...
        </div>
      }
    >
      <ShopView
        products={catalog.products}
        total={catalog.total}
        page={catalog.page}
        totalPages={catalog.totalPages}
        categories={categories}
        activeCategorySlug={resolvedCategorySlug}
        title={title}
        subtitle={subtitle}
      />
    </Suspense>
  );
}
