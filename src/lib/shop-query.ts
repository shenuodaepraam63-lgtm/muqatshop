import { supabase, type Product } from "@/lib/supabase";

export type ShopFilters = {
  categoryId?: string | null;
  q?: string | null;
  type?: string | null;
  stock?: string | null;
  sort?: string | null;
  limit?: number;
};

export async function fetchShopProducts(f: ShopFilters): Promise<Product[]> {
  let req = supabase.from("products").select("*").eq("is_active", true);

  if (f.categoryId) req = req.eq("category_id", f.categoryId);
  if (f.type && f.type !== "all") req = req.eq("product_type", f.type);
  if (f.q?.trim()) {
    const t = f.q.trim();
    req = req.or(`name.ilike.%${t}%,description.ilike.%${t}%,brand.ilike.%${t}%`);
  }
  if (f.stock === "in") req = req.gt("stock", 0);

  const sort = f.sort || "new";
  if (sort === "price_asc") req = req.order("price", { ascending: true });
  else if (sort === "price_desc") req = req.order("price", { ascending: false });
  else if (sort === "name") req = req.order("name", { ascending: true });
  else req = req.order("created_at", { ascending: false });

  req = req.limit(f.limit ?? 48);
  const { data } = await req;
  return (data as Product[]) || [];
}
