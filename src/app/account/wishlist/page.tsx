"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Trash2 } from "lucide-react";
import { useWishlistStore } from "@/lib/wishlist";
import { formatPrice } from "@/lib/utils";

/** Same local wishlist store as storefront — no duplicate system. */
export default function AccountWishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[#14243A]">المفضلة</h2>
        <p className="mt-1 text-sm text-[#718096]">
          المنتجات التي حفظتها على هذا الجهاز. نفس قائمة المفضلة في المتجر.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D6DDEA] bg-white px-4 py-12 text-center">
          <Heart className="mx-auto mb-3 h-10 w-10 text-[#C8D0DC]" strokeWidth={1.5} />
          <p className="font-semibold text-[#14243A]">قائمة المفضلة فارغة</p>
          <p className="mt-2 text-sm text-[#718096]">
            اضغط ♥ على أي منتج من المتجر لحفظه هنا.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <li
              key={item.productId}
              className="relative overflow-hidden rounded-2xl border border-[#E4E9F0] bg-white shadow-sm"
            >
              <Link href={`/products/${encodeURIComponent(item.slug)}`} className="block">
                <div className="relative aspect-square bg-[#F6F8FB]">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width:768px) 50vw, 20vw"
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-semibold text-[#202B3C]">{item.name}</p>
                  <p className="mt-1 text-sm font-bold text-[#14243A]">{formatPrice(item.price)}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => remove(item.productId)}
                className="absolute left-2 top-2 rounded-full border border-[#E4E9F0] bg-white p-2 shadow-sm"
                aria-label="إزالة من المفضلة"
              >
                <Trash2 className="h-4 w-4 text-[#D64C4C]" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
