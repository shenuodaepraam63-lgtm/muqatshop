"use client";

import Link from "next/link";
import Image from "next/image";
import { useWishlistStore } from "@/lib/wishlist";
import { formatPrice } from "@/lib/utils";
import { Heart, Trash2 } from "lucide-react";

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);

  if (items.length === 0) {
    return (
      <div className="max-w-page mx-auto px-4 py-20 text-center">
        <Heart className="w-12 h-12 mx-auto text-muted mb-3 opacity-40" />
        <h1 className="text-2xl font-bold mb-2">قائمة الأمنيات فارغة</h1>
        <p className="text-muted mb-6 text-sm">اضغط ♥ على أي منتج لحفظه هنا</p>
        <Link href="/shop" className="inline-block bg-ink text-page px-8 py-3 rounded-full text-sm font-semibold">
          تصفح المتجر
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-page mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">قائمة الأمنيات ({items.length})</h1>
      <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <li key={item.productId} className="relative bg-[#f5f1e8] rounded-2xl overflow-hidden">
            <Link href={`/products/${encodeURIComponent(item.slug)}`} className="block">
              <div className="relative aspect-square bg-[#ebe6dc]">
                {item.image && (
                  <Image src={item.image} alt="" fill className="object-cover" sizes="25vw" />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold line-clamp-2">{item.name}</p>
                <p className="text-sm font-bold mt-1">{formatPrice(item.price)}</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => remove(item.productId)}
              className="absolute top-2 left-2 bg-white/90 rounded-full p-2 shadow"
              aria-label="إزالة"
            >
              <Trash2 className="w-4 h-4 text-sale" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
