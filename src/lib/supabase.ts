import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ProductColor = { name: string; hex: string };

export type ProductVariant = {
  size?: string | null;
  color?: string | null;
  color_hex?: string | null;
  price?: number | null;
  stock: number;
};

export type ProductType = "mug" | "clothing" | "general";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  sale_ends_at?: string | null;
  category_id: string | null;
  brand: string | null;
  material: string | null;
  colors: ProductColor[] | null;
  sizes?: string[] | null;
  variants?: ProductVariant[] | null;
  product_type?: ProductType | string | null;
  features: string | null;
  specs: string | null;
  images: string[] | null;
  main_image_index: number | null;
  stock: number | null;
  weight: string | null;
  weight_value?: number | null;
  dimensions: string | null;
  origin_country: string | null;
  care_instructions: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  sort_order?: number | null;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
};

export type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  governorate: string;
  center: string;
  area: string | null;
  street: string | null;
  apartment: string | null;
  phone: string;
  phone_alt: string | null;
  notes: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  created_at: string;
  updated_at?: string;
};

export function productMainImage(product: {
  images?: string[] | null;
  main_image_index?: number | null;
}): string | null {
  const imgs = product.images;
  if (!imgs || imgs.length === 0) return null;
  const idx = product.main_image_index ?? 0;
  return imgs[Math.min(Math.max(0, idx), imgs.length - 1)] || imgs[0] || null;
}

export function findVariant(
  variants: ProductVariant[] | null | undefined,
  size?: string | null,
  color?: string | null
): ProductVariant | undefined {
  if (!variants?.length) return undefined;
  return variants.find((v) => {
    const sizeOk = (v.size || "") === (size || "");
    const colorOk = (v.color || "") === (color || "");
    return sizeOk && colorOk;
  });
}

export function variantStock(
  product: Pick<Product, "stock" | "variants">,
  size?: string | null,
  color?: string | null
): number {
  const v = findVariant(product.variants, size, color);
  if (v) return Number(v.stock) || 0;
  if (product.variants && product.variants.length > 0) return 0;
  return Number(product.stock) || 0;
}

export function variantPrice(
  product: Pick<Product, "price" | "variants">,
  size?: string | null,
  color?: string | null
): number {
  const v = findVariant(product.variants, size, color);
  if (v && v.price != null && !Number.isNaN(Number(v.price))) {
    return Number(v.price);
  }
  return Number(product.price) || 0;
}
