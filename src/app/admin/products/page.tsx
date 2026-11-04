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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`حذف المنتج "${name}"؟`)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) setProducts((p) => p.filter((x) => x.id !== id));
    else alert("فشل الحذف");
  };

  const toggleActive = async (p: Product) => {
    await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    void load();
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
            <Plus className="h-4 w-4" /> أضف أول منتج
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E4E9F0] bg-white">
          <div className="overflow-x-auto">
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
                  const low = (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 3;
                  return (
                    <tr key={p.id} className="hover:bg-[#F6F8FB]/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#EEF2F7]">
                            {img ? (
                              <Image src={img} alt="" fill className="object-cover" sizes="48px" />
                            ) : (
                              <div className="grid h-full place-items-center text-[10px] text-[#94A3B8]">
                                —
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="max-w-[220px] truncate font-medium text-[#202B3C]">
                              {p.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {formatPrice(Number(p.price))}
                      </td>
                      <td className={`px-4 py-3 ${low ? "font-semibold text-[#D64C4C]" : ""}`}>
                        {p.stock}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void toggleActive(p)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            p.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-[#718096]"
                          }`}
                        >
                          {p.is_active ? "نشط" : "مخفي"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="rounded-lg p-2 text-[#718096] hover:bg-gray-50 hover:text-[#14243A]"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleDelete(p.id, p.name)}
                            className="rounded-lg p-2 text-[#718096] hover:bg-red-50 hover:text-[#D64C4C]"
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
        </div>
      )}
    </div>
  );
}
