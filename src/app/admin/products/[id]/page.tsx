"use client";

import { useEffect, useState, use } from "react";
import { supabase, type Product } from "@/lib/supabase";
import { ProductForm } from "@/components/admin/ProductForm";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setProduct(data as Product | null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="text-muted">جاري التحميل...</p>;
  if (!product) return <p className="text-sale">المنتج غير موجود</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">تعديل منتج</h1>
      <ProductForm product={product} />
    </div>
  );
}
