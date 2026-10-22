"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store";

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  disabled?: boolean;
};

export function AddToCartButton({ product, disabled }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [done, setDone] = useState(false);

  const onClick = () => {
    if (disabled) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full sm:w-auto min-w-[200px] bg-ink text-page px-8 py-3.5 rounded-btn text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {disabled ? "غير متوفر" : done ? "تمت الإضافة ✓" : "أضف إلى السلة"}
    </button>
  );
}
