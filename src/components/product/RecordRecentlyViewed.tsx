"use client";

import { useEffect } from "react";
import { pushRecentlyViewed } from "@/lib/recently-viewed";

export function RecordRecentlyViewed(props: {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  sale_ends_at?: string | null;
  image: string;
  stock?: number | null;
}) {
  useEffect(() => {
    pushRecentlyViewed({
      id: props.id,
      name: props.name,
      slug: props.slug,
      price: props.price,
      compare_at_price: props.compare_at_price,
      sale_ends_at: props.sale_ends_at,
      image: props.image,
      stock: props.stock,
    });
  }, [props.id, props.name, props.slug, props.price, props.compare_at_price, props.sale_ends_at, props.image, props.stock]);

  return null;
}
