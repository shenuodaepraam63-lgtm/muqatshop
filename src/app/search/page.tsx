"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/components/home/ProductCard";
import { supabase, productMainImage, type Product, type Category } from "@/lib/supabase";

function SearchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qParam = searchParams.get("q") || "";
  const [query, setQuery] = useState(qParam);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(searchParams.get("type") || "all");
  const [cat, setCat] = useState(searchParams.get("cat") || "all");

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, slug")
      .order("sort_order")
      .then(({ data }) => setCategories((data as Category[]) || []));
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      let req = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(48);

      if (query.trim()) {
        const t = query.trim();
        req = req.or(`name.ilike.%${t}%,description.ilike.%${t}%,brand.ilike.%${t}%`);
      }
      if (type !== "all") req = req.eq("product_type", type);
      if (cat !== "all") req = req.eq("category_id", cat);

      const { data } = await req;
      setProducts((data as Product[]) || []);
      setLoading(false);
    };
    const t = setTimeout(run, 200);
    return () => clearTimeout(t);
  }, [query, type, cat]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (type !== "all") params.set("type", type);
    if (cat !== "all") params.set("cat", cat);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="max-w-page mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold mb-4">بحث</h1>
      <form onSubmit={onSubmit} className="space-y-3 mb-8">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالاسم أو الوصف أو الماركة..."
          className="w-full max-w-lg border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink/15"
          autoFocus
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="text-sm border border-[#e8e2d9] rounded-full px-3 py-2 bg-white"
          >
            <option value="all">كل الأنواع</option>
            <option value="clothing">ملابس</option>
            <option value="mug">مجات</option>
            <option value="general">عام</option>
          </select>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="text-sm border border-[#e8e2d9] rounded-full px-3 py-2 bg-white"
          >
            <option value="all">كل الأقسام</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="text-sm bg-ink text-white rounded-full px-5 py-2 font-medium"
          >
            بحث
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/shop" className="text-sm underline text-muted">
          تصفح كل المتجر
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/categories/${c.slug}`}
            className="text-sm px-3 py-1 rounded-full border border-[#e8e2d9]"
          >
            {c.name}
          </Link>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">جاري البحث...</p>
      ) : products.length === 0 ? (
        <p className="text-muted">لا توجد نتائج</p>
      ) : (
        <>
          <p className="text-sm text-muted mb-4">{products.length} نتيجة</p>
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
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted">جاري التحميل...</div>}>
      <SearchInner />
    </Suspense>
  );
}
