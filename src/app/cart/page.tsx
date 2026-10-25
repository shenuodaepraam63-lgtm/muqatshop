"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { Trash2, Minus, Plus } from "lucide-react";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { getMerchantSession } from "@/lib/merchant";
import { CartGuard } from "./CartGuard";

function CartPageInner() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const updatePrice = useCartStore((s) => s.updatePrice);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const totalBase = useCartStore((s) => s.totalBase());
  const [isMerchant, setIsMerchant] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsMerchant(!!getMerchantSession());
  }, []);

  useEffect(() => {
    const next: Record<string, string> = {};
    items.forEach((i) => {
      next[i.id] = String(i.price);
    });
    setDrafts(next);
  }, [items]);

  const applyPrice = (id: string, base: number, raw: string) => {
    const n = Number(raw);
    if (raw.trim() === "" || Number.isNaN(n)) {
      setErrors((e) => ({ ...e, [id]: "برجاء وضع سعر مناسب" }));
      return;
    }
    if (n < base) {
      setErrors((e) => ({ ...e, [id]: "ممنوع السعر أقل برجاء وضع سعر مناسب" }));
      setDrafts((d) => ({ ...d, [id]: String(items.find((x) => x.id === id)?.price ?? base) }));
      return;
    }
    setErrors((e) => {
      const copy = { ...e };
      delete copy[id];
      return copy;
    });
    updatePrice(id, n);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-page mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-3">السلة فارغة</h1>
        <p className="text-muted mb-6">لم تضف أي منتجات بعد</p>
        <Link href="/shop" className="inline-block bg-ink text-page px-8 py-3 rounded-btn text-sm font-semibold">تسوق الآن</Link>
      </div>
    );
  }

  const profit = totalPrice - totalBase;

  return (
    <div className="max-w-page mx-auto px-4 md:px-8 py-8 md:py-12">
      <h1 className="text-2xl font-bold mb-2">سلة التسوق وإتمام الطلب</h1>
      {isMerchant && (
        <p className="text-sm text-muted mb-6">وضع التاجر: امسح السعر واكتب سعرك — ممنوع أقل من سعر المتجر.</p>
      )}
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div>
          <ul className="space-y-4 mb-6">
            {items.map((item) => {
              const base = item.basePrice ?? item.price;
              return (
                <li key={item.id} className="flex gap-4 bg-card/50 rounded-2xl p-3 border border-border">
                  <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-card shrink-0">
                    {item.image ? <Image src={item.image} alt="" fill className="object-cover" sizes="80px" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                    {!isMerchant && <p className="text-sm font-semibold mt-1">{formatPrice(item.price)}</p>}
                    {isMerchant && (
                      <div className="mt-2 space-y-1.5">
                        <p className="text-xs text-muted">سعر المتجر: {formatPrice(base)}</p>
                        <label className="text-xs font-medium block">سعر البيع للعميل</label>
                        <input type="number" min={base} step="1" value={drafts[item.id] ?? String(item.price)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDrafts((d) => ({ ...d, [item.id]: v }));
                            const n = Number(v);
                            if (v.trim() !== "" && !Number.isNaN(n) && n < base) {
                              setErrors((err) => ({ ...err, [item.id]: "ممنوع السعر أقل برجاء وضع سعر مناسب" }));
                            } else {
                              setErrors((err) => { const c = { ...err }; delete c[item.id]; return c; });
                            }
                          }}
                          onBlur={() => applyPrice(item.id, base, drafts[item.id] ?? String(item.price))}
                          className={`w-full max-w-[160px] border rounded-lg px-2 py-1.5 text-sm font-semibold ${
                            errors[item.id] ? "border-sale ring-1 ring-sale/30" : "border-border"
                          }`}
                        />
                        {errors[item.id] && <p className="text-xs text-sale font-medium">{errors[item.id]}</p>}
                        {!errors[item.id] && item.price > base && (
                          <p className="text-xs text-green-700">ربحك: {formatPrice((item.price - base) * item.quantity)}</p>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => removeItem(item.id)} className="mr-auto p-2 text-muted hover:text-sale"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-border pt-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-muted">مجموع المنتجات</span>
              <span className="text-lg font-bold">{formatPrice(totalPrice)}</span>
            </div>
            {isMerchant && profit > 0 && (
              <div className="flex items-center justify-between text-sm text-green-700">
                <span>ربحك المتوقع</span>
                <span className="font-semibold">{formatPrice(profit)}</span>
              </div>
            )}
          </div>
        </div>
        <CheckoutForm />
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <CartGuard>
      <CartPageInner />
    </CartGuard>
  );
}
