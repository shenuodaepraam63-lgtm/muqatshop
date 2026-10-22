"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { Trash2, Minus, Plus } from "lucide-react";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalPrice = useCartStore((s) => s.totalPrice());

  if (items.length === 0) {
    return (
      <div className="max-w-page mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-3">السلة فارغة</h1>
        <p className="text-muted mb-6">لم تضف أي منتجات بعد</p>
        <Link
          href="/"
          className="inline-block bg-ink text-page px-8 py-3 rounded-btn text-sm font-semibold"
        >
          تسوق الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      <h1 className="text-2xl font-bold mb-8">سلة التسوق</h1>
      <ul className="space-y-4 mb-8">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex gap-4 bg-card/50 rounded-media p-3 border border-border"
          >
            <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-card shrink-0">
              {item.image ? (
                <Image src={item.image} alt="" fill className="object-cover" sizes="80px" />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
              <p className="text-sm font-semibold mt-1">{formatPrice(item.price)}</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="mr-auto p-2 text-muted hover:text-sale"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-border pt-4 flex items-center justify-between mb-6">
        <span className="font-medium">الإجمالي</span>
        <span className="text-xl font-bold">{formatPrice(totalPrice)}</span>
      </div>
      <button
        type="button"
        className="w-full bg-ink text-page py-3.5 rounded-btn text-sm font-semibold hover:opacity-90"
      >
        إتمام الطلب (قريباً)
      </button>
    </div>
  );
}
