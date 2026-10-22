import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ProductColor = {
  name: string;
  hex: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  images: string[];
  main_image_index: number;
  category_id: string | null;
  brand: string | null;
  material: string | null;
  colors: ProductColor[];
  features: string | null;
  specs: string | null;
  weight: string | null;
  dimensions: string | null;
  origin_country: string | null;
  care_instructions: string | null;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
};
