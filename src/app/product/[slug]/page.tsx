import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase, productMainImage, type Product, type ProductColor } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/product/AddToCartButton";

export const dynamic = "force-dynamic";

async function getProduct(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as Product;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(decodeURIComponent(slug));
  if (!product) notFound();

  const images = product.images?.length ? product.images : [];
  const main = productMainImage(product);
  const colors = (product.colors || []) as ProductColor[];
  const features = product.features
    ? product.features.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];
  const onSale =
    product.compare_at_price != null &&
    Number(product.compare_at_price) > Number(product.price);
  const outOfStock = (product.stock ?? 0) <= 0;

  return (
    <div className="max-w-page mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[3/4] rounded-media overflow-hidden bg-card mb-3">
            {main ? (
              <Image
                src={main}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted">
                لا صورة
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((url, i) => (
                <div
                  key={url + i}
                  className="relative aspect-square rounded-lg overflow-hidden bg-card"
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="120px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand && (
            <p className="text-sm text-muted mb-1">{product.brand}</p>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-ink mb-3">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-xl font-bold">
              {formatPrice(Number(product.price))}
            </span>
            {onSale && (
              <span className="text-muted line-through">
                {formatPrice(Number(product.compare_at_price))}
              </span>
            )}
            {onSale && (
              <span className="text-xs bg-sale text-white px-2 py-0.5 rounded-full">
                خصم
              </span>
            )}
          </div>

          {outOfStock && (
            <p className="text-sale font-medium mb-4">نفد من المخزون</p>
          )}

          {colors.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">الألوان</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <span
                    key={c.hex + c.name}
                    className="inline-flex items-center gap-2 bg-card rounded-full pl-1 pr-3 py-1 text-sm"
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-black/10"
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.material && (
            <p className="text-sm text-muted mb-4">
              <span className="font-medium text-ink">الخامة:</span> {product.material}
            </p>
          )}

          {product.description && (
            <div className="text-sm text-muted leading-relaxed mb-6 whitespace-pre-line">
              {product.description}
            </div>
          )}

          {features.length > 0 && (
            <ul className="list-disc list-inside text-sm space-y-1 mb-6 text-ink">
              {features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}

          {product.specs && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-1">المواصفات</p>
              <p className="text-sm text-muted whitespace-pre-line">{product.specs}</p>
            </div>
          )}

          {/* Optional extras */}
          {(product.weight || product.dimensions || product.origin_country || product.care_instructions) && (
            <div className="border-t border-border pt-4 mb-6 space-y-1 text-sm text-muted">
              {product.weight && <p>الوزن: {product.weight}</p>}
              {product.dimensions && <p>الأبعاد: {product.dimensions}</p>}
              {product.origin_country && <p>بلد المنشأ: {product.origin_country}</p>}
              {product.care_instructions && <p>العناية: {product.care_instructions}</p>}
            </div>
          )}

          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              price: Number(product.price),
              image: main || "",
            }}
            disabled={outOfStock}
          />

          <Link href="/" className="block mt-6 text-sm text-muted hover:text-ink">
            ← العودة للتسوق
          </Link>
        </div>
      </div>
    </div>
  );
}
