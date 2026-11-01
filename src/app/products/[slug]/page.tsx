import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  supabase,
  productMainImage,
  type Product,
  type ProductColor,
  type ProductVariant,
} from "@/lib/supabase";
import { isSaleActive, salePercent } from "@/lib/utils";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductBuyBox } from "@/components/product/ProductBuyBox";
import { SimilarProducts } from "@/components/product/SimilarProducts";
import { ProductReviews } from "@/components/product/ProductReviews";
import { RecordRecentlyViewed } from "@/components/product/RecordRecentlyViewed";
import { ProductRecentlyViewed } from "@/components/product/ProductRecentlyViewed";
import { SizeGuide } from "@/components/product/SizeGuide";

export const dynamic = "force-dynamic";

async function getProduct(rawSlug: string): Promise<Product | null> {
  const slug = decodeURIComponent(rawSlug).trim();
  let { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) {
    const byId = await supabase
      .from("products")
      .select("*")
      .eq("id", slug)
      .eq("is_active", true)
      .maybeSingle();
    data = byId.data;
  }
  return data as Product | null;
}

async function getCategoryChain(categoryId: string | null | undefined) {
  if (!categoryId) return [] as { name: string; slug: string }[];
  const chain: { name: string; slug: string }[] = [];
  let currentId: string | null = categoryId;
  for (let i = 0; i < 4 && currentId; i++) {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id")
      .eq("id", currentId)
      .maybeSingle();
    if (!data) break;
    chain.unshift({ name: data.name as string, slug: data.slug as string });
    currentId = (data.parent_id as string | null) || null;
  }
  return chain;
}

async function getSimilar(product: Product): Promise<Product[]> {
  let q = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .neq("id", product.id)
    .limit(8);

  if (product.category_id) {
    q = q.eq("category_id", product.category_id);
  }

  const { data } = await q;
  if (data && data.length > 0) return data as Product[];

  const { data: fallback } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .neq("id", product.id)
    .limit(8);
  return (fallback as Product[]) || [];
}

async function getSizeGuideText(): Promise<string | null> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "size_guide")
    .maybeSingle();
  if (!data?.value) return null;
  if (typeof data.value === "string") return data.value.trim() || null;
  if (typeof data.value === "object" && data.value !== null && "text" in data.value) {
    return String((data.value as { text?: string }).text || "").trim() || null;
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "منتج غير موجود | Muqatshop" };
  const img = productMainImage(product);
  return {
    title: `${product.name} | Muqatshop`,
    description: (product.description || product.name).slice(0, 160),
    openGraph: {
      title: product.name,
      description: (product.description || "").slice(0, 160),
      images: img ? [img] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [similar, sizeGuideText, categoryChain] = await Promise.all([
    getSimilar(product),
    getSizeGuideText(),
    getCategoryChain(product.category_id),
  ]);

  const images = product.images?.length ? product.images : [];
  const main = productMainImage(product) || "";
  const colors = (product.colors || []) as ProductColor[];
  const sizes = (product.sizes || []) as string[];
  const variants = (product.variants || []) as ProductVariant[];
  const features = product.features
    ? product.features.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];

  const price = Number(product.price);
  const compare =
    product.compare_at_price == null ? null : Number(product.compare_at_price);
  const onSale = isSaleActive(price, compare, product.sale_ends_at);
  const percent = onSale && compare ? salePercent(price, compare) : 0;

  const stockNum = Number(product.stock) || 0;
  const hasVariantStock =
    variants.length > 0 && variants.some((v) => Number(v.stock) > 0);
  const available = variants.length > 0 ? hasVariantStock : stockNum > 0;

  const badges: { label: string; tone?: "sale" | "new" | "out" }[] = [];
  if (!available) badges.push({ label: "غير متوفر", tone: "out" });
  else if (percent > 0) badges.push({ label: `خصم ${percent}%`, tone: "sale" });

  // مواصفات من حقول المنتج فقط
  const specs: { label: string; value: string }[] = [];
  if (product.brand?.trim()) specs.push({ label: "العلامة التجارية", value: product.brand.trim() });
  if (product.material?.trim()) specs.push({ label: "الخامة", value: product.material.trim() });
  if (product.weight?.trim()) specs.push({ label: "الوزن", value: product.weight.trim() });
  else if (product.weight_value != null)
    specs.push({ label: "الوزن", value: `${product.weight_value} جرام` });
  if (product.dimensions?.trim()) specs.push({ label: "الأبعاد", value: product.dimensions.trim() });
  if (product.origin_country?.trim())
    specs.push({ label: "بلد المنشأ", value: product.origin_country.trim() });
  if (product.sku?.trim()) specs.push({ label: "كود المنتج", value: product.sku.trim() });

  for (const s of product.detail_sections || []) {
    if (s.kind === "specs" || (s.rows && s.rows.length)) {
      for (const r of s.rows || []) {
        if ((r.label || "").trim() && (r.value || "").trim()) {
          specs.push({ label: r.label.trim(), value: r.value.trim() });
        }
      }
    }
  }

  const shortDesc = product.description?.trim() || "";

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-24 md:pb-8">
      <RecordRecentlyViewed
        id={product.id}
        name={product.name}
        slug={product.slug}
        price={price}
        compare_at_price={product.compare_at_price}
        sale_ends_at={product.sale_ends_at}
        image={main}
        stock={product.stock}
      />

      {/* Breadcrumb */}
      <nav
        className="border-b border-[#E5EAF1] bg-white text-[11px] text-[#667085] sm:text-[13px]"
        aria-label="مسار التنقل"
      >
        <div className="home-container flex flex-wrap items-center gap-2 py-2.5">
          <Link href="/" className="hover:text-[#3157D5]">
            الرئيسية
          </Link>
          <span aria-hidden>/</span>
          <Link href="/shop" className="hover:text-[#3157D5]">
            المتجر
          </Link>
          {categoryChain.map((c, idx) => (
            <span key={c.slug} className="contents">
              <span aria-hidden>/</span>
              <Link
                href={
                  idx === 0 && categoryChain.length > 1
                    ? `/shop?category=${encodeURIComponent(c.slug)}`
                    : `/shop?category=${encodeURIComponent(categoryChain[0].slug)}${
                        idx > 0 ? `&subcategory=${encodeURIComponent(c.slug)}` : ""
                      }`
                }
                className="hover:text-[#3157D5]"
              >
                {c.name}
              </Link>
            </span>
          ))}
          <span aria-hidden>/</span>
          <span className="line-clamp-1 font-semibold text-[#14243A]">{product.name}</span>
        </div>
      </nav>

      <div className="home-container py-5 sm:py-8">
        {/* Main section: gallery | info | buy — stacks on mobile */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,42%)_minmax(0,34%)_minmax(0,24%)] lg:gap-5">
          {/* Gallery */}
          <div className="min-w-0">
            <ProductGallery images={images} name={product.name} badges={badges} />
          </div>

          {/* Info */}
          <div className="min-w-0 space-y-4">
            {product.brand?.trim() && (
              <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                {product.brand.trim()}
              </p>
            )}
            <h1 className="text-[21px] font-bold leading-[1.5] text-[#14243A] sm:text-[28px]">
              {product.name}
            </h1>

            {shortDesc && (
              <p className="text-[13px] leading-7 text-[#667085] sm:text-[15px] line-clamp-5">
                {shortDesc}
              </p>
            )}

            {features.length > 0 && (
              <ul className="space-y-2 rounded-[12px] border border-[#E5EAF1] bg-white p-4">
                {features.slice(0, 5).map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-[#14243A]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#18A999]" />
                    {f}
                  </li>
                ))}
              </ul>
            )}

            {/* Mobile buy box under info */}
            <div className="lg:hidden">
              <div className="rounded-[12px] border border-[#E5EAF1] bg-white p-4">
                <ProductBuyBox
                  product={{
                    id: product.id,
                    name: product.name,
                    price,
                    compareAtPrice: compare,
                    saleEndsAt: product.sale_ends_at,
                    image: main,
                    slug: product.slug,
                    stock: product.stock,
                  }}
                  colors={colors}
                  sizes={sizes}
                  variants={variants}
                />
              </div>
            </div>
          </div>

          {/* Purchase panel desktop */}
          <aside className="hidden min-w-0 lg:block">
            <div className="rounded-[16px] border border-[#E5EAF1] bg-white p-5">
              <ProductBuyBox
                product={{
                  id: product.id,
                  name: product.name,
                  price,
                  compareAtPrice: compare,
                  saleEndsAt: product.sale_ends_at,
                  image: main,
                  slug: product.slug,
                  stock: product.stock,
                }}
                colors={colors}
                sizes={sizes}
                variants={variants}
              />
            </div>
          </aside>
        </div>

        {/* Description */}
        {shortDesc && (
          <section className="mt-8 rounded-[12px] border border-[#E5EAF1] bg-white p-3.5 sm:rounded-[14px] sm:p-6">
            <h2 className="mb-3 text-lg font-bold text-[#14243A] sm:text-[22px]">وصف المنتج</h2>
            <div className="whitespace-pre-wrap text-[13px] leading-[1.8] text-[#667085] sm:text-[15px]">
              {shortDesc}
            </div>
          </section>
        )}

        {/* Specs */}
        {specs.length > 0 && (
          <section className="mt-5 rounded-[12px] border border-[#E5EAF1] bg-white p-3.5 sm:rounded-[14px] sm:p-6">
            <h2 className="mb-3 text-lg font-bold text-[#14243A] sm:text-[22px]">المواصفات</h2>
            <dl>
              {specs.map((row) => (
                <div
                  key={row.label + row.value}
                  className="grid grid-cols-[minmax(0,40%)_1fr] gap-2 border-b border-[#E5EAF1] py-3 text-sm last:border-0 sm:py-3.5"
                >
                  <dt className="font-semibold text-[#14243A]">{row.label}</dt>
                  <dd className="text-[#667085]">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {product.care_instructions?.trim() && (
          <section className="mt-5 rounded-[12px] border border-[#E5EAF1] bg-white p-3.5 sm:p-6">
            <h2 className="mb-2 text-lg font-bold text-[#14243A]">تعليمات العناية</h2>
            <p className="whitespace-pre-wrap text-sm leading-7 text-[#667085]">
              {product.care_instructions.trim()}
            </p>
          </section>
        )}

        {/* Delivery — general only, no invented fees */}
        <section className="mt-5 rounded-[12px] border border-[#E5EAF1] bg-white p-3.5 sm:p-6">
          <h2 className="mb-2 text-lg font-bold text-[#14243A]">التوصيل</h2>
          <p className="text-sm leading-7 text-[#667085]">
            يتم حساب رسوم ومدة التوصيل عند إتمام الطلب وفق عنوانك وخيارات الشحن المتاحة.
            لا نعرض أسماء الموردين — التعامل مع Muqatshop مباشرة.
          </p>
        </section>

        <SizeGuide productType={product.product_type} customText={sizeGuideText} />

        {/* Reviews */}
        <div className="mt-8 max-w-3xl">
          <ProductReviews productId={product.id} />
        </div>
      </div>

      <SimilarProducts products={similar} />
      <ProductRecentlyViewed excludeId={product.id} />
    </div>
  );
}
