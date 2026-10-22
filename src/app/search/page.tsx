"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/home/ProductCard";
import { supabase, productMainImage, type Product } from "@/lib/supabase";

function SearchInner() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [query, setQuery] = useState(q);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      let req = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(40);
      if (query.trim()) {
        req = req.ilike("name", `%${query.trim()}%`);
      }
      const { data } = await req;
      setProducts((data as Product[]) || []);
      setLoading(false);
    };
    run();
  }, [query]);

  return (
    <div className="max-w-page mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold mb-4">بحث</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث عن منتج..."
        className="w-full max-w-md border border-border rounded-xl px-4 py-3 text-sm mb-8 focus:outline-none focus:ring-2 focus:ring-ink/15"
        autoFocus
      />
      {loading ? (
        <p className="text-muted">جاري البحث...</p>
      ) : products.length === 0 ? (
        <p className="text-muted">لا توجد نتائج</p>
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

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted">جاري التحميل...</div>}>
      <SearchInner />
    </Suspense>
  );
}
