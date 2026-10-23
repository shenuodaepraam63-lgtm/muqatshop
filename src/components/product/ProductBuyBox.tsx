"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import type { ProductColor } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    image: string;
  };
  colors: ProductColor[];
  outOfStock?: boolean;
  /** optional free-text customization (name on necklace, etc.) */
  allowNote?: boolean;
};

export function ProductBuyBox({ product, colors, outOfStock, allowNote }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [colorIdx, setColorIdx] = useState(0);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const selectedColor = colors[colorIdx];
  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > product.price;

  const onAdd = () => {
    if (outOfStock) return;
    const parts = [product.name];
    if (selectedColor) parts.push(selectedColor.name);
    if (note.trim()) parts.push(note.trim());
    addItem({
      productId: product.id,
      name: parts.join(" — "),
      price: product.price,
      image: product.image,
      quantity: qty,
      variant: [selectedColor?.name, note.trim()].filter(Boolean).join(" / ") || undefined,
    });
    setDone(true);
    setTimeout(() => setDone(false), 2200);
  };

  return (
    <>
      <div className="space-y-5 pb-24 md:pb-0">
        {colors.length > 0 && (
          <div>
            <p className="text-sm mb-2.5">
              اللون{selectedColor ? ` : ${selectedColor.name}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c, i) => (
                <button
                  key={c.hex + c.name}
                  type="button"
                  onClick={() => setColorIdx(i)}
                  className={`min-w-[88px] px-5 py-2.5 rounded-full text-sm font-medium border transition ${
                    colorIdx === i
                      ? "bg-ink text-page border-ink"
                      : "bg-transparent border-[#d4cfc4] text-ink"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {allowNote && (
          <div>
            <p className="text-sm mb-2">التخصيص / الاسم المطلوب</p>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اكتب الاسم أو أي ملاحظة للتخصيص"
              className="w-full border border-[#e8e2d9] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>
        )}

        {outOfStock ? (
          <p className="text-sale font-medium">نفد من المخزون</p>
        ) : (
          <div>
            <p className="text-sm mb-2">الكمية</p>
            <div className="inline-flex items-center border border-[#e8e2d9] rounded-full overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-11 h-11 flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="w-11 h-11 flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Desktop / tablet buy */}
        <button
          type="button"
          onClick={onAdd}
          disabled={outOfStock}
          className="hidden md:block w-full bg-ink text-page py-3.5 rounded-full text-sm font-semibold tracking-wide hover:opacity-90 transition disabled:opacity-40"
        >
          {outOfStock ? "غير متوفر" : done ? "تمت الإضافة ✓" : "أضف إلى السلة"}
        </button>

        {!outOfStock && (
          <Link
            href="/cart"
            onClick={onAdd}
            className="hidden md:flex w-full items-center justify-center bg-[#1a2744] text-white py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition"
          >
            اشترِ الآن
          </Link>
        )}
      </div>

      {/* Mobile sticky bar — like Elvora */}
      <div className="md:hidden fixed bottom-16 inset-x-0 z-40 px-3 pb-2 pointer-events-none">
        <div className="pointer-events-auto bg-white border border-[#e8e2d9] shadow-lg rounded-2xl p-2.5 flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#ebe6dc] shrink-0">
            {product.image && (
              <Image src={product.image} alt="" fill className="object-cover" sizes="48px" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{product.name}</p>
            <p className="text-sm font-bold">
              {formatPrice(product.price)}
              {onSale && product.compareAtPrice != null && (
                <span className="text-xs text-muted line-through mr-1.5 font-normal">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={outOfStock}
            className="shrink-0 bg-[#1a2744] text-white text-sm font-semibold px-5 py-2.5 rounded-full disabled:opacity-40"
          >
            {outOfStock ? "نفد" : done ? "✓" : "اشترِ الآن"}
          </button>
        </div>
      </div>
    </>
  );
}
