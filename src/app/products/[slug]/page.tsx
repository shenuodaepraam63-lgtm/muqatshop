import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase, productMainImage, type Product, type ProductColor } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductBuyBox } from "@/components/product/ProductBuyBox";
import { ProductAccordion } from "@/components/product/ProductAccordion";
import { SimilarProducts } from "@/components/product/SimilarProducts";
import { SaleCountdown } from "@/components/product/SaleCountdown";

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

  const { data: fallback } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .neq("id", product.id)
    .limit(8);
  return (fallback as Product[]) || [];
}

async function getReturnPolicy(): Promise<string | null> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "return_policy")
    .maybeSingle();
  if (!data?.value) return null;
  if (typeof data.value === "string") return data.value.trim() || null;
  if (typeof data.value === "object" && data.value !== null && "text" in data.value) {
    const t = (data.value as { text?: string }).text;
    return t?.trim() || null;
  }
  return null;
}

function looksLikeMug(product: Product): boolean {
  const t = `${product.name} ${product.description || ""} ${product.slug}`.toLowerCase();
  return /مج|كوب|كباية|mug|cup|كبايه/.test(t);
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [similar, returnPolicy] = await Promise.all([
    getSimilar(product),
    getReturnPolicy(),
  ]);

  const images = product.images?.length ? product.images : [];
  const main = productMainImage(product) || "";
  const colors = (product.colors || []) as ProductColor[];
  const features = product.features
    ? product.features.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];

  const saleEndsAt = product.sale_ends_at || null;
  const saleActive =
    saleEndsAt != null &&
    !Number.isNaN(new Date(saleEndsAt).getTime()) &&
    new Date(saleEndsAt).getTime() > Date.now();

  const onSale =
    product.compare_at_price != null &&
    Number(product.compare_at_price) > Number(product.price) &&
    (saleEndsAt == null || saleActive);

  const outOfStock = (product.stock ?? 0) <= 0;
  const showTryMug = looksLikeMug(product);

  const accordionItems: { title: string; content: React.ReactNode }[] = [];

  if (product.description?.trim()) {
    accordionItems.push({ title: "الوصف", content: product.description.trim() });
  }
  if (features.length) {
    accordionItems.push({
      title: "المميزات",
      content: features.map((f) => `• ${f}`).join("\n"),
    });
  }
  if (product.specs?.trim()) {
    accordionItems.push({ title: "المواصفات", content: product.specs.trim() });
  }
  if (product.care_instructions?.trim()) {
    accordionItems.push({
      title: "تعليمات العناية",
      content: product.care_instructions.trim(),
    });
  }

  const extra: string[] = [];
  if (product.material?.trim()) extra.push(`الخامة: ${product.material.trim()}`);
  if (product.weight?.trim()) extra.push(`الوزن: ${product.weight.trim()}`);
  if (product.dimensions?.trim()) extra.push(`الأبعاد: ${product.dimensions.trim()}`);
  if (product.origin_country?.trim())
    extra.push(`بلد المنشأ: ${product.origin_country.trim()}`);
  if (extra.length) {
    accordionItems.push({ title: "تفاصيل إضافية", content: extra.join("\n") });
  }

  if (returnPolicy) {
    accordionItems.push({
      title: "سياسة الاستبدال والاسترجاع",
      content: returnPolicy,
    });
  }

  return (
    <div className="bg-page min-h-screen">
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
        <div className="grid min-w-0 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
          <div className="min-w-0">
            <ProductGallery images={images} name={product.name} />
          </div>

          <div className="min-w-0 md:sticky md:top-28">
            {product.brand?.trim() && (
              <p className="text-[11px] tracking-widest uppercase text-muted mb-2">
                {product.brand.trim()}
              </p>
            )}

            <h1 className="text-2xl md:text-3xl font-bold text-ink leading-tight mb-3">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mb-4 flex-wrap">
              <span className="text-xl md:text-2xl font-bold text-ink">
                {formatPrice(Number(product.price))}
              </span>
              {onSale && (
                <span className="text-base text-muted line-through">
                  {formatPrice(Number(product.compare_at_price))}
                </span>
              )}
              {onSale && saleActive && (
                <span className="text-[11px] font-bold bg-sale/10 text-sale px-2 py-0.5 rounded-full">
                  عرض محدود
                </span>
              )}
            </div>

            {saleActive && saleEndsAt && <SaleCountdown endsAt={saleEndsAt} />}

            {product.description?.trim() && (
              <p className="text-sm text-muted leading-relaxed mb-6 line-clamp-3">
                {product.description.trim()}
              </p>
            )}

            {showTryMug && (
              <Link
                href={`/try-mug?product=${encodeURIComponent(product.slug)}&name=${encodeURIComponent(product.name)}`}
                className="mb-5 flex items-center justify-center gap-2 w-full border-2 border-ink text-ink py-3 rounded-full text-sm font-semibold hover:bg-ink hover:text-page transition"
              >
                ☕ جرّب المج قبل الشراء
              </Link>
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
                slug: product.slug,
              }}
              colors={colors}
              outOfStock={outOfStock}
            />

            {accordionItems.length > 0 && (
              <ProductAccordion items={accordionItems} />
            )}
          </div>
        </div>
      </div>

      <SimilarProducts products={similar} />
    </div>
  );
}
