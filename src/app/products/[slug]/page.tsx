import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase, productMainImage, type Product, type ProductColor } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductBuyBox } from "@/components/product/ProductBuyBox";

export const dynamic = "force-dynamic";

async function getProduct(rawSlug: string): Promise<Product | null> {
  const slug = decodeURIComponent(rawSlug).trim();

  // Try exact slug first
  let { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) {
    // Fallback: match by id
    const byId = await supabase
      .from("products")
      .select("*")
      .eq("id", slug)
      .eq("is_active", true)
      .maybeSingle();
    data = byId.data;
  }

  if (!data) return null;
  return data as Product;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

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

  return (
    <div className="bg-page min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-[#e8e2d4] text-[11px] tracking-wide uppercase text-muted">
        <div className="max-w-page mx-auto px-4 md:px-8 py-2.5 flex flex-wrap gap-1 items-center">
          <Link href="/" className="hover:text-ink">
            الرئيسية
          </Link>
          <span>/</span>
          <Link href="/collections" className="hover:text-ink">
            المنتجات
          </Link>
          <span>/</span>
          <span className="text-ink line-clamp-1">{product.name}</span>
        </div>
      </div>

      <div className="max-w-page mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
          {/* Gallery */}
          <ProductGallery images={images} name={product.name} />

          {/* Buy box */}
          <div className="md:sticky md:top-28">
            {product.brand && (
              <p className="text-[11px] tracking-widest uppercase text-muted mb-2">
                {product.brand}
              </p>
            )}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-ink leading-tight mb-3">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-5">
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
              <p className="text-sm text-muted leading-relaxed mb-6">
                {product.description}
              </p>
            )}

            {product.material && (
              <p className="text-sm mb-4">
                <span className="text-muted">الخامة: </span>
                <span className="font-medium">{product.material}</span>
              </p>
            )}

            <ProductBuyBox
              product={{
                id: product.id,
                name: product.name,
                price: Number(product.price),
                image: main,
              }}
              colors={colors}
              outOfStock={outOfStock}
            />

            {features.length > 0 && (
              <ul className="mt-8 space-y-2 text-sm text-ink">
                {features.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-muted">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}

            {product.specs && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm font-semibold mb-2">المواصفات</p>
                <p className="text-sm text-muted whitespace-pre-line">{product.specs}</p>
              </div>
            )}

            {(product.weight ||
              product.dimensions ||
              product.origin_country ||
              product.care_instructions) && (
              <div className="mt-6 pt-6 border-t border-border space-y-1.5 text-sm text-muted">
                {product.weight && <p>الوزن: {product.weight}</p>}
                {product.dimensions && <p>الأبعاد: {product.dimensions}</p>}
                {product.origin_country && <p>بلد المنشأ: {product.origin_country}</p>}
                {product.care_instructions && (
                  <p>العناية: {product.care_instructions}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
