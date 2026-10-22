"use client";

import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">إضافة منتج جديد</h1>
      <ProductForm />
    </div>
  );
}
