"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { adminJson } from "@/lib/admin-api";
import { Plus, Pencil, Trash2, Package } from "lucide-react";

function mainImage(p: Product): string | null {
  if (!p.images?.length) return null;
  const idx = Math.min(p.main_image_index ?? 0, p.images.length - 1);
  return p.images[idx] || p.images[0] || null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminJson<{ ok: boolean; products: Product[] }>(
        "/api/admin/products?limit=200"
      );
      setProducts(data.products || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر التحميل");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`حذف المنتج "${name}"؟`)) return;
    try {
      await adminJson(`/api/admin/products/${id}?hard=1`, { method: "DELETE" });
      setProducts((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "فشل الحذف");
    }
  };

  const toggleActive = async (p: Product) => {
    try {
      await adminJson(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !p.is_active }),
      });
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "فشل التحديث");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#14243A]">إدارة المنتجات</h2>
          <p className="text-sm text-[#718096]">{products.length} منتج</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#14243A] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          إضافة منتج
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-[#D64C4C]">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-[#718096]">جاري التحميل...</p>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-[#E4E9F0] bg-white py-16 text-center">
          <Package className="mx-auto mb-3 h-12 w-12 text-[#94A3B8] opacity-60" />
          <p className="mb-4 text-[#718096]">لا توجد منتجات بعد</p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#14243A] px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> إضافة منتج
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E4E9F0] bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-[#E4E9F0] bg-[#F6F8FB]">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-[#718096]">المنتج</th>
                <th className="px-4 py-3 text-right font-medium text-[#718096]">السعر</th>
                <th className="px-4 py-3 text-right font-medium text-[#718096]">المخزون</th>
                <th className="px-4 py-3 text-right font-medium text-[#718096]">الحالة</th>
                <th className="px-4 py-3 text-right font-medium text-[#718096]">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E9F0]">
              {products.map((p) => {
                const img = mainImage(p);
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-[#F6F8FB]">
                          {img ? (
                            <Image src={img} alt="" fill className="object-cover" sizes="48px" />
                          ) : null}
                        </div>
                        <span className="font-medium text-[#14243A]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatPrice(Number(p.price))}</td>
                    <td className="px-4 py-3">{p.stock ?? 0}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void toggleActive(p)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          p.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-[#718096]"
                        }`}
                      >
                        {p.is_active ? "نشط" : "موقوف"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="rounded-lg border border-[#E4E9F0] p-2 hover:bg-[#F6F8FB]"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDelete(p.id, p.name)}
                          className="rounded-lg border border-[#E4E9F0] p-2 text-[#D64C4C] hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
