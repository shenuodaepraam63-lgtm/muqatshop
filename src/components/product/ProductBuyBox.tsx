"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import type { ProductColor, ProductVariant } from "@/lib/supabase";
import { findVariant, variantPrice, variantStock } from "@/lib/supabase";
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
    stock?: number | null;
  };
  colors: ProductColor[];
  sizes: string[];
  variants: ProductVariant[];
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ProductBuyBox({ product, colors, sizes, variants }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<string>(sizes[0] || "");
  const [colorIdx, setColorIdx] = useState(0);
  const [done, setDone] = useState(false);

  const selectedColor = colors[colorIdx];
  const colorName = selectedColor?.name || "";

  const hasMatrix = variants.length > 0;

  const stock = useMemo(() => {
    if (hasMatrix) {
      return variantStock({ stock: product.stock, variants }, size || null, colorName || null);
    }
    return Number(product.stock) || 0;
  }, [hasMatrix, variants, product.stock, size, colorName]);

  const unitPrice = useMemo(() => {
    if (hasMatrix) {
      return variantPrice({ price: product.price, variants }, size || null, colorName || null);
    }
    return product.price;
  }, [hasMatrix, variants, product.price, size, colorName]);

  const outOfStock = stock <= 0;

  const sizeAvailable = (s: string) => {
    if (!hasMatrix) return true;
    if (colors.length === 0) {
      const v = findVariant(variants, s, null);
      return (v?.stock ?? 0) > 0;
    }
    return colors.some((c) => (findVariant(variants, s, c.name)?.stock ?? 0) > 0);
  };

  const colorAvailable = (cName: string) => {
    if (!hasMatrix) return true;
    if (sizes.length === 0) {
      const v = findVariant(variants, null, cName);
      return (v?.stock ?? 0) > 0;
    }
    return (findVariant(variants, size || null, cName)?.stock ?? 0) > 0;
  };

  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > unitPrice;

  const pageUrl =
    typeof window !== "undefined" && product.slug
      ? `${window.location.origin}/products/${product.slug}`
      : undefined;

  const variantLabel = [size, colorName].filter(Boolean).join(" / ");

  const waHref = whatsappProductUrl(
    variantLabel ? `${product.name} (${variantLabel})` : product.name,
    pageUrl
  );

  const onAdd = () => {
    if (outOfStock) return;
    if (sizes.length && !size) return;
    addItem({
      productId: product.id,
      name: variantLabel ? `${product.name} — ${variantLabel}` : product.name,
      price: unitPrice,
      image: product.image,
      quantity: Math.min(qty, stock),
      variant: variantLabel || undefined,
    });
    setDone(true);
    setTimeout(() => setDone(false), 2200);
  };

  return (
    <>
      <div className="space-y-5 pb-24 md:pb-0">
        {sizes.length > 0 && (
          <div>
            <p className="text-sm mb-2.5">المقاس{size ? ` : ${size}` : ""}</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const ok = sizeAvailable(s);
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!ok}
                    onClick={() => setSize(s)}
                    className={`min-w-[48px] px-3.5 py-2.5 rounded-full text-sm font-medium border transition ${
                      size === s
                        ? "bg-ink text-page border-ink"
                        : ok
                          ? "bg-transparent border-[#d4cfc4] text-ink"
                          : "bg-transparent border-[#e8e2d9] text-muted line-through opacity-50"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {colors.length > 0 && (
          <div>
            <p className="text-sm mb-2.5">
              اللون{selectedColor ? ` : ${selectedColor.name}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c, i) => {
                const ok = colorAvailable(c.name);
                return (
                  <button
                    key={c.hex + c.name}
                    type="button"
                    disabled={!ok}
                    onClick={() => setColorIdx(i)}
                    className={`min-w-[88px] px-5 py-2.5 rounded-full text-sm font-medium border transition ${
                      colorIdx === i
                        ? "bg-ink text-page border-ink"
                        : ok
                          ? "bg-transparent border-[#d4cfc4] text-ink"
                          : "opacity-40 border-[#e8e2d9] line-through"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold">{formatPrice(unitPrice)}</span>
          {onSale && product.compareAtPrice != null && (
            <span className="text-sm text-muted line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        {outOfStock ? (
          <p className="text-sale font-medium">نفد من المخزون لهذا الخيار</p>
        ) : (
          <div>
            <p className="text-sm mb-2">
              الكمية{" "}
              <span className="text-muted text-xs">(المتاح: {stock})</span>
            </p>
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
                onClick={() => setQty((q) => Math.min(stock, q + 1))}
                className="w-11 h-11 flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

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

      <div className="md:hidden fixed bottom-16 inset-x-0 z-40 px-3 pb-2 pointer-events-none">
        <div className="pointer-events-auto bg-white border border-[#e8e2d9] shadow-lg rounded-2xl p-2.5 flex items-center gap-2">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[#ebe6dc] shrink-0">
            {product.image && (
              <Image src={product.image} alt="" fill className="object-cover" sizes="44px" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium truncate">{product.name}</p>
            <p className="text-sm font-bold">{formatPrice(unitPrice)}</p>
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
