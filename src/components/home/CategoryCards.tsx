import type { Category } from "@/lib/supabase";
import { HorizontalCategoryCarousel } from "@/components/categories/HorizontalCategoryCarousel";
import "@/components/categories/HorizontalCategoryCarousel.css";

/** Homepage horizontal categories strip (shared carousel). */
export function CategoryCards({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;

  const items = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    image: cat.image,
    href: `/categories/${encodeURIComponent(cat.slug)}`,
  }));

  return <HorizontalCategoryCarousel items={items} ariaLabel="تصنيفات المتجر" />;
}
