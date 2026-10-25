"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store";
import { productMainImage, type Product } from "@/lib/supabase";
import { ensureCanPurchase, redirectToCustomerAuth } from "@/lib/purchase-guard";

type Props = {
  product: Pick<
    Product,
    "id" | "name" | "slug" | "price" | "images" | "main_image_index"
  >;
  disabled?: boolean;
};

export function AddToCartButton({ product, disabled }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [done, setDone] = useState(false);

  const onClick = () => {
    if (!ensureCanPurchase()) {
      redirectToCustomerAuth(
        `/products/${encodeURIComponent(product.slug)}`
      );
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      basePrice: Number(product.price),
      image: productMainImage(product) || "",
    });
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full bg-ink text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-50"
    >
      {done ? "تمت الإضافة ✓" : "أضف إلى السلة"}
    </button>
  );
}
