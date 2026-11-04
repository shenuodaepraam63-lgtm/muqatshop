"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Product } from "@/lib/supabase";
import { ProductForm } from "@/components/admin/ProductForm";
import { adminJson } from "@/lib/admin-api";

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminJson<{ ok: boolean; product: Product }>(
          `/api/admin/products/${id}`
        );
        const row = data.product;
        setProduct({
          ...row,
          price: Number(row.price),
          compare_at_price:
            row.compare_at_price != null ? Number(row.compare_at_price) : null,
          images: row.images || [],
          colors: row.colors || [],
          sizes: row.sizes || [],
          variants: row.variants || [],
          main_image_index: row.main_image_index || 0,
          stock: row.stock ?? 0,
        } as Product);
      } catch (e) {
        setError(e instanceof Error ? e.message : "المنتج غير موجود");
      } finally {
        setLoading(false);
      }
    };
    void load();
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
          sizes: product.sizes || [],
          variants: product.variants || [],
          product_type: product.product_type,
          features: product.features,
          specs: product.specs,
          weight: product.weight,
          weight_value: product.weight_value,
          dimensions: product.dimensions,
          origin_country: product.origin_country,
          care_instructions: product.care_instructions,
          detail_sections: product.detail_sections,
          sale_ends_at: product.sale_ends_at,
        }}
      />
    </div>
  );
}
