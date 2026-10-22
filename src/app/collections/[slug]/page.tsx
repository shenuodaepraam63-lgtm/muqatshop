import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/components/home/ProductCard";
import { supabase, productMainImage, type Product, type Category } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function CollectionSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", decoded)
    .maybeSingle();

  // Special virtual collections
  let products: Product[] = [];
  let title = category?.name || decoded;

  if (category) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("category_id", category.id)
      .order("created_at", { ascending: false });
    products = (data as Product[]) || [];
  } else if (decoded === "new") {
    title = "جديد";
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(24);
    products = (data as Product[]) || [];
  } else if (decoded === "bags") {
    title = "مقاطف";
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", "bags")
      .maybeSingle();
    if (cat) {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("category_id", cat.id)
        .order("created_at", { ascending: false });
      products = (data as Product[]) || [];
    } else {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      products = (data as Product[]) || [];
    }
  } else if (!category) {
    notFound();
  }

  return (
    <div className="max-w-page mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="mb-6">
        <Link href="/collections" className="text-sm text-muted hover:text-ink">
          ← كل المنتجات
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mt-2">{title}</h1>
      </div>

      {products.length === 0 ? (
        <p className="text-muted text-center py-16">لا توجد منتجات في هذا التصنيف</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              slug={p.slug}
              price={Number(p.price)}
              compareAtPrice={
                p.compare_at_price != null ? Number(p.compare_at_price) : null
              }
              image={productMainImage(p) || ""}
            />
          ))}
        </div>
      )}
    </div>
  );
}
