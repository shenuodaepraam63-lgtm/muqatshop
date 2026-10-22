"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase, type Product } from "@/lib/supabase";
import { ProductForm } from "@/components/admin/ProductForm";

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data, error: err } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (err || !data) {
        setError("المنتج غير موجود");
      } else {
        setProduct({
          ...data,
          price: Number(data.price),
          compare_at_price:
            data.compare_at_price != null ? Number(data.compare_at_price) : null,
          images: data.images || [],
          colors: data.colors || [],
          main_image_index: data.main_image_index || 0,
          stock: data.stock ?? 0,
        } as Product);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="text-muted py-12">جاري التحميل...</div>;
  if (error || !product)
    return <div className="text-red-600 py-12">{error || "خطأ"}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-6">تعديل المنتج</h1>
      <ProductForm
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          compare_at_price: product.compare_at_price,
          images: product.images || [],
          main_image_index: product.main_image_index ?? 0,
          stock: product.stock ?? 0,
          is_featured: product.is_featured,
          is_active: product.is_active,
          category_id: product.category_id,
          brand: product.brand,
          material: product.material,
          colors: product.colors || [],
          features: product.features,
          specs: product.specs,
          weight: product.weight,
          dimensions: product.dimensions,
          origin_country: product.origin_country,
          care_instructions: product.care_instructions,
          sale_ends_at: product.sale_ends_at,
        }}
      />
    </div>
  );
}
