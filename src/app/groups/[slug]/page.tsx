import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase, productMainImage } from "@/lib/supabase";
import { ProductCard } from "@/components/home/ProductCard";

export const dynamic = "force-dynamic";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const { data: group } = await supabase
    .from("category_groups")
    .select("*")
    .eq("slug", decoded)
    .maybeSingle();

  if (!group) notFound();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id")
    .eq("group_id", group.id)
    .order("sort_order");

  const allCats = categories || [];
  const roots = allCats.filter((c) => !c.parent_id);
  const catIds = allCats.map((c) => c.id);

  let products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_at_price: number | null;
    sale_ends_at: string | null;
    images: string[] | null;
    main_image_index: number | null;
    stock: number | null;
    category_id: string | null;
  }[] = [];

  if (catIds.length) {
    const { data } = await supabase
      .from("products")
      .select(
        "id, name, slug, price, compare_at_price, sale_ends_at, images, main_image_index, stock, category_id"
      )
      .eq("is_active", true)
      .in("category_id", catIds)
      .order("created_at", { ascending: false });
    products = data || [];
  }

  const catName = (id: string | null) =>
    allCats.find((c) => c.id === id)?.name || group.name;

  return (
    <div className="bg-page min-h-screen">
      <div className="bg-[#e8e2d4] text-[11px] tracking-wide uppercase text-muted">
        <div className="max-w-page mx-auto px-4 md:px-8 py-2.5 flex flex-wrap gap-1 items-center">
          <Link href="/" className="hover:text-ink">
            الرئيسية
          </Link>
          <span>/</span>
          <Link href="/groups" className="hover:text-ink">
            الأقسام
          </Link>
          <span>/</span>
          <span className="text-ink">{group.name}</span>
        </div>
      </div>

      <div className="max-w-page mx-auto px-4 md:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">{group.name}</h1>

        {roots.length > 0 && (
          <div className="space-y-6 mb-10">
            {roots.map((root) => {
              const kids = allCats.filter((c) => c.parent_id === root.id);
              return (
                <div key={root.id}>
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={`/categories/${encodeURIComponent(root.slug)}`}
                      className="font-semibold hover:underline"
                    >
                      {root.name}
                    </Link>
                  </div>
                  {kids.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {kids.map((c) => (
                        <Link
                          key={c.id}
                          href={`/categories/${encodeURIComponent(c.slug)}`}
                          className="text-sm px-4 py-2 rounded-full bg-[#f0ebe3] hover:bg-ink hover:text-white transition"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Link
                      href={`/categories/${encodeURIComponent(root.slug)}`}
                      className="text-sm px-4 py-2 rounded-full bg-[#f0ebe3] hover:bg-ink hover:text-white transition inline-block"
                    >
                      عرض المنتجات
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {products.length === 0 ? (
          <p className="text-muted text-center py-12">لا توجد منتجات في هذه المجموعة</p>
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
                saleEndsAt={p.sale_ends_at}
                image={productMainImage(p) || ""}
                category={catName(p.category_id)}
                stock={p.stock}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
