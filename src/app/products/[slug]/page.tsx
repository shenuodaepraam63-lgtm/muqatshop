import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase, productMainImage, type Product, type ProductColor } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductBuyBox } from "@/components/product/ProductBuyBox";
import { ProductAccordion } from "@/components/product/ProductAccordion";
import { SimilarProducts } from "@/components/product/SimilarProducts";

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

  // fallback: any other products
  const { data: any } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .neq("id", product.id)
    .limit(8);
  return (any as Product[]) || [];
}

const DEFAULT_RETURN_POLICY = `سياسة الاستبدال والاسترجاع:
• يمكن استبدال أو استرجاع المنتج خلال 14 يومًا من الاستلام بشرط أن يكون بحالته الأصلية.
• المنتجات المخصصة (مثل نقش الاسم) غير قابلة للاسترجاع إلا في حال وجود عيب تصنيع.
• تواصل معنا عبر واتساب لفتح طلب استبدال أو استرجاع.`;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const similar = await getSimilar(product);
  const images = product.images?.length ? product.images : [];
  const main = productMainImage(product) || "";
  const colors = (product.colors || []) as ProductColor[];
  const features = product.features
    ? product.features.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];
  const onSale =
    product.compare_at_price != null &&
    Number(product.compare_at_price) > Number(product.price);
  const outOfStock = (product.stock ?? 0) <= 0;

  const accordionItems: { title: string; content: React.ReactNode }[] = [];

  if (product.description) {
    accordionItems.push({
      title: "الوصف",
      content: product.description,
    });
  }
  if (features.length) {
    accordionItems.push({
      title: "المميزات",
      content: features.map((f) => `• ${f}`).join("\n"),
    });
  }
  if (product.specs) {
    accordionItems.push({ title: "المواصفات", content: product.specs });
  }
  if (product.care_instructions) {
    accordionItems.push({ title: "تعليمات العناية", content: product.care_instructions });
  }
  const extra: string[] = [];
  if (product.material) extra.push(`الخامة: ${product.material}`);
  if (product.weight) extra.push(`الوزن: ${product.weight}`);
  if (product.dimensions) extra.push(`الأبعاد: ${product.dimensions}`);
  if (product.origin_country) extra.push(`بلد المنشأ: ${product.origin_country}`);
  if (extra.length) {
    accordionItems.push({ title: "تفاصيل إضافية", content: extra.join("\n") });
  }
  accordionItems.push({
    title: "سياسة الاستبدال والاسترجاع",
    content: DEFAULT_RETURN_POLICY,
  });

  return (
    <div className="bg-page min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-[#e8e2d4] text-[11px] tracking-wide uppercase text-muted">
        <div className="max-w-page mx-auto px-4 md:px-8 py-2.5 flex flex-wrap gap-1 items-center">
          <Link href="/" className="hover:text-ink">
            الرئيسية
          </Link>
          <span>/</span>
          <Link href="/#products" className="hover:text-ink">
            المنتجات
          </Link>
          <span>/</span>
          <span className="text-ink line-clamp-1">{product.name}</span>
        </div>
      </div>

      <div className="max-w-page mx-auto px-4 md:px-8 py-5 md:py-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
          <ProductGallery images={images} name={product.name} />

          <div className="md:sticky md:top-28">
            {product.brand && (
              <p className="text-[11px] tracking-widest uppercase text-muted mb-2">
                {product.brand}
              </p>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-ink leading-tight mb-3">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-xl md:text-2xl font-bold text-ink">
                {formatPrice(Number(product.price))}
              </span>
              {onSale && (
                <span className="text-base text-muted line-through">
                  {formatPrice(Number(product.compare_at_price))}
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-muted leading-relaxed mb-6 line-clamp-3">
                {product.description}
              </p>
            )}

            <ProductBuyBox
              product={{
                id: product.id,
                name: product.name,
                price: Number(product.price),
                compareAtPrice:
                  product.compare_at_price != null
                    ? Number(product.compare_at_price)
                    : null,
                image: main,
              }}
              colors={colors}
              outOfStock={outOfStock}
              allowNote
            />

            <ProductAccordion items={accordionItems} />
          </div>
        </div>
      </div>

      <SimilarProducts products={similar} />
    </div>
  );
}
