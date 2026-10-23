"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import type { ProductColor } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { whatsappProductUrl } from "@/lib/whatsapp";
import { Minus, Plus } from "lucide-react";

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    image: string;
    slug?: string;
  };
  colors: ProductColor[];
  outOfStock?: boolean;
  allowNote?: boolean;
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ProductBuyBox({ product, colors, outOfStock, allowNote }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [colorIdx, setColorIdx] = useState(0);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const selectedColor = colors[colorIdx];
  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > product.price;

  const pageUrl =
    typeof window !== "undefined" && product.slug
      ? `${window.location.origin}/products/${product.slug}`
      : undefined;

  const waHref = whatsappProductUrl(
    selectedColor ? `${product.name} (${selectedColor.name})` : product.name,
    pageUrl
  );

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

        {/* Desktop actions */}
        <div className="hidden md:grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onAdd}
            disabled={outOfStock}
            className="w-full bg-ink text-page py-3.5 rounded-full text-sm font-semibold tracking-wide hover:opacity-90 transition disabled:opacity-40"
          >
            {outOfStock ? "غير متوفر" : done ? "تمت الإضافة ✓" : "أضف إلى السلة"}
          </button>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition"
          >
            <WhatsAppIcon className="w-5 h-5" />
            واتساب
          </a>
        </div>

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

      {/* Mobile sticky bar */}
      <div className="md:hidden fixed bottom-16 inset-x-0 z-40 px-3 pb-2 pointer-events-none">
        <div className="pointer-events-auto bg-white border border-[#e8e2d9] shadow-lg rounded-2xl p-2.5 flex items-center gap-2">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[#ebe6dc] shrink-0">
            {product.image && (
              <Image src={product.image} alt="" fill className="object-cover" sizes="44px" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium truncate">{product.name}</p>
            <p className="text-sm font-bold">
              {formatPrice(product.price)}
              {onSale && product.compareAtPrice != null && (
                <span className="text-[10px] text-muted line-through mr-1 font-normal">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </p>
          </div>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-11 h-11 rounded-full bg-[#25D366] text-white flex items-center justify-center"
            aria-label="واتساب"
          >
            <WhatsAppIcon className="w-5 h-5" />
          </a>
          <button
            type="button"
            onClick={onAdd}
            disabled={outOfStock}
            className="shrink-0 bg-[#1a2744] text-white text-xs font-semibold px-4 py-2.5 rounded-full disabled:opacity-40"
          >
            {outOfStock ? "نفد" : done ? "✓" : "اشترِ الآن"}
          </button>
        </div>
      </div>
    </>
  );
}
