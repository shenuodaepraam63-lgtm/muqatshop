"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase, type Product } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { Plus, Pencil, Trash2, Package } from "lucide-react";

function mainImage(p: Product): string | null {
  if (!p.images?.length) return null;
  const idx = Math.min(p.main_image_index ?? 0, p.images.length - 1);
  return p.images[idx] || p.images[0] || null;
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setProducts(data as Product[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`حذف المنتج "${name}"؟`)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) setProducts((p) => p.filter((x) => x.id !== id));
    else alert("فشل الحذف");
  };

  const toggleActive = async (p: Product) => {
    await supabase
      .from("products")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">المنتجات</h1>
          <p className="text-sm text-muted mt-1">{products.length} منتج</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          إضافة منتج
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted">جاري التحميل...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8e2d9] py-16 text-center">
          <Package className="w-12 h-12 text-muted mx-auto mb-3 opacity-50" />
          <p className="text-muted mb-4">لا توجد منتجات بعد</p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            أضف أول منتج
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e8e2d9] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#faf8f5] border-b border-[#e8e2d9]">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-muted">المنتج</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">السعر</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">المخزون</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">الحالة</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e2d9]">
                {products.map((p) => {
                  const img = mainImage(p);
                  return (
                    <tr key={p.id} className="hover:bg-[#faf8f5]/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#f0ebe3] shrink-0">
                            {img ? (
                              <Image src={img} alt="" fill className="object-cover" sizes="48px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-muted">
                                —
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-ink truncate max-w-[200px]">{p.name}</div>
                            {p.is_featured && (
                              <span className="text-[10px] text-amber-600">مميز</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatPrice(Number(p.price))}</td>
                      <td className="px-4 py-3">{p.stock}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleActive(p)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            p.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-muted"
                          }`}
                        >
                          {p.is_active ? "نشط" : "مخفي"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="p-2 text-muted hover:text-ink hover:bg-gray-50 rounded-lg"
                            title="تعديل"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-2 text-muted hover:text-sale hover:bg-sale/10 rounded-lg"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
