"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store";
import type { ProductColor } from "@/lib/supabase";
import { Minus, Plus } from "lucide-react";

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  colors: ProductColor[];
  outOfStock?: boolean;
};

export function ProductBuyBox({ product, colors, outOfStock }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [colorIdx, setColorIdx] = useState(0);
  const [done, setDone] = useState(false);

  const selectedColor = colors[colorIdx];

  const onAdd = () => {
    if (outOfStock) return;
    addItem({
      productId: product.id,
      name: selectedColor
        ? `${product.name} — ${selectedColor.name}`
        : product.name,
      price: product.price,
      image: product.image,
      quantity: qty,
      variant: selectedColor?.name,
    });
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };

  return (
    <div className="space-y-5">
      {colors.length > 0 && (
        <div>
          <p className="text-sm mb-2">
            اللون{selectedColor ? `: ${selectedColor.name}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c, i) => (
              <button
                key={c.hex + c.name}
                type="button"
                onClick={() => setColorIdx(i)}
                className={`px-4 py-2 rounded-full text-sm border transition ${
                  colorIdx === i
                    ? "bg-ink text-page border-ink"
                    : "bg-transparent border-border text-ink hover:border-ink"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10"
                    style={{ backgroundColor: c.hex }}
                  />
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {outOfStock ? (
        <p className="text-sale font-medium">نفد من المخزون</p>
      ) : (
        <div>
          <p className="text-sm mb-2">الكمية</p>
          <div className="inline-flex items-center border border-border rounded-full overflow-hidden">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-11 h-11 flex items-center justify-center hover:bg-card"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center text-sm font-medium">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="w-11 h-11 flex items-center justify-center hover:bg-card"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onAdd}
        disabled={outOfStock}
        className="w-full bg-ink text-page py-3.5 rounded-full text-sm font-semibold tracking-wide hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {outOfStock ? "غير متوفر" : done ? "تمت الإضافة ✓" : "أضف إلى السلة"}
      </button>
    </div>
  );
}
