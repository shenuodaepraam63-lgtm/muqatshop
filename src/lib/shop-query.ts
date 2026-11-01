import {
  supabase,
  type Product,
  collectCategoryIdsWithDescendants,
} from "@/lib/supabase";
import { isSaleActive } from "@/lib/utils";

export const SHOP_PAGE_SIZE = 20;

export type ShopSort =
  | "new"
  | "price_asc"
  | "price_desc"
  | "discount"
  | "name";

export type ShopQueryInput = {
  categoryId?: string | null;
  includeDescendants?: boolean;
  q?: string | null;
  /** legacy product_type filter */
  type?: string | null;
  stock?: string | null;
  sort?: string | null;
  offers?: boolean;
  minPrice?: number | null;
  maxPrice?: number | null;
  page?: number;
  pageSize?: number;
};

export type ShopQueryResult = {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function available(product: Product): boolean {
  if (product.variants?.length) {
    return product.variants.some((v) => Number(v.stock) > 0);
  }
  return Number(product.stock) > 0;
}

export async function fetchShopProducts(f: ShopQueryInput): Promise<Product[]> {
  const res = await fetchShopCatalog(f);
  return res.products;
}

export async function fetchShopCatalog(f: ShopQueryInput): Promise<ShopQueryResult> {
  const pageSize = Math.min(Math.max(f.pageSize ?? SHOP_PAGE_SIZE, 1), 48);
  const page = Math.max(f.page ?? 1, 1);
  const sort = (f.sort || "new") as ShopSort;

  let req = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  if (f.categoryId) {
    if (f.includeDescendants) {
      const { data: allCats } = await supabase
        .from("categories")
        .select("id, parent_id");
      const ids = collectCategoryIdsWithDescendants(
        f.categoryId,
        (allCats as { id: string; parent_id?: string | null }[]) || []
      );
      req = req.in("category_id", ids);
    } else {
      req = req.eq("category_id", f.categoryId);
    }
  }

  if (f.type && f.type !== "all") req = req.eq("product_type", f.type);

  if (f.q?.trim()) {
    const t = f.q.trim().replace(/[%_,]/g, " ");
    req = req.or(`name.ilike.%${t}%,description.ilike.%${t}%,brand.ilike.%${t}%`);
  }

  if (f.stock === "in") req = req.gt("stock", 0);

  if (f.minPrice != null && !Number.isNaN(f.minPrice)) {
    req = req.gte("price", f.minPrice);
  }
  if (f.maxPrice != null && !Number.isNaN(f.maxPrice)) {
    req = req.lte("price", f.maxPrice);
  }

  if (f.offers) {
    req = req.not("compare_at_price", "is", null);
  }

  if (sort === "price_asc") req = req.order("price", { ascending: true });
  else if (sort === "price_desc") req = req.order("price", { ascending: false });
  else if (sort === "name") req = req.order("name", { ascending: true });
  else req = req.order("created_at", { ascending: false });

  // Fetch a wider window when offers/discount sort need post-filter
  const needsPost = Boolean(f.offers || sort === "discount");
  if (needsPost) {
    req = req.limit(200);
  } else {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    req = req.range(from, to);
  }

  const { data, count, error } = await req;
  if (error) {
    return { products: [], total: 0, page, pageSize, totalPages: 0 };
  }

  let products = ((data as Product[]) || []).filter((p) => p.is_active);

  if (f.stock === "in") {
    products = products.filter(available);
  }

  if (f.offers) {
    products = products.filter((p) =>
      isSaleActive(
        Number(p.price),
        p.compare_at_price == null ? null : Number(p.compare_at_price),
        p.sale_ends_at
      )
    );
  }

  if (sort === "discount") {
    products = [...products].sort((a, b) => {
      const da =
        Number(a.compare_at_price || 0) > Number(a.price)
          ? (Number(a.compare_at_price) - Number(a.price)) / Number(a.compare_at_price)
          : 0;
      const db =
        Number(b.compare_at_price || 0) > Number(b.price)
          ? (Number(b.compare_at_price) - Number(b.price)) / Number(b.compare_at_price)
          : 0;
      return db - da;
    });
  }

  if (needsPost) {
    const total = products.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return {
      products: products.slice(start, start + pageSize),
      total,
      page: safePage,
      pageSize,
      totalPages,
    };
  }

  const total = count ?? products.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    products,
    total,
    page: Math.min(page, totalPages),
    pageSize,
    totalPages,
  };
}
