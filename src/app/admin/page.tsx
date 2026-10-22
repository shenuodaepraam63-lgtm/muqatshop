"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, type Product, productMainImage } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";

const ADMIN_KEY = "muqat_admin_ok";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(ADMIN_KEY) === "1") {
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    loadProducts();
  }, [authed]);

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setProducts(data as Product[]);
    setLoading(false);
  }

  function login(e: React.FormEvent) {
    e.preventDefault();
    // Simple client gate — replace with real auth later
    if (password === "muqat2026") {
      localStorage.setItem(ADMIN_KEY, "1");
      setAuthed(true);
      setError("");
    } else {
      setError("كلمة المرور غير صحيحة");
    }
  }

  async function toggleActive(p: Product) {
    await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    loadProducts();
  }

  async function deleteProduct(id: string) {
    if (!confirm("حذف المنتج نهائياً؟")) return;
    await supabase.from("products").delete().eq("id", id);
    loadProducts();
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-16">
        <h1 className="text-2xl font-bold mb-6 text-center">دخول لوحة التحكم</h1>
        <form onSubmit={login} className="bg-page border border-border rounded-media p-6 space-y-4">
          <div>
            <label className="block text-sm mb-1">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-ink/20"
              autoFocus
            />
          </div>
          {error && <p className="text-sale text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-ink text-page py-2.5 rounded-btn font-semibold hover:opacity-90"
          >
            دخول
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold">المنتجات</h1>
        <Link
          href="/admin/products/new"
          className="bg-ink text-page px-5 py-2.5 rounded-btn text-sm font-semibold hover:opacity-90"
        >
          + إضافة منتج
        </Link>
      </div>

      {loading ? (
        <p className="text-muted">جاري التحميل...</p>
      ) : products.length === 0 ? (
        <div className="bg-page border border-border rounded-media p-10 text-center">
          <p className="text-muted mb-4">لا توجد منتجات بعد</p>
          <Link href="/admin/products/new" className="text-sm font-semibold underline">
            أضف أول منتج
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const img = productMainImage(p);
            return (
              <div
                key={p.id}
                className="bg-page border border-border rounded-media p-4 flex gap-4 items-center"
              >
                <div className="w-16 h-16 rounded-lg bg-card overflow-hidden shrink-0">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted">
                      لا صورة
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{p.name}</div>
                  <div className="text-sm text-muted">
                    {formatPrice(Number(p.price))}
                    {!p.is_active && (
                      <span className="mr-2 text-sale">· مخفي</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="text-sm px-3 py-1.5 border border-border rounded-lg hover:bg-card"
                  >
                    تعديل
                  </Link>
                  <button
                    onClick={() => toggleActive(p)}
                    className="text-sm px-3 py-1.5 border border-border rounded-lg hover:bg-card"
                  >
                    {p.is_active ? "إخفاء" : "إظهار"}
                  </button>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="text-sm px-3 py-1.5 text-sale border border-sale/30 rounded-lg hover:bg-sale/5"
                  >
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
