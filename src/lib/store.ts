"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  /** سعر البيع للعميل (قد يرفعه التاجر) */
  price: number;
  /** سعر المتجر الأساسي — لا يقل البيع عنه */
  basePrice: number;
  image: string;
  quantity: number;
  variant?: string;
};

export type AddCartItemInput = Omit<CartItem, "id" | "quantity" | "basePrice"> & {
  quantity?: number;
  basePrice?: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: AddCartItemInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updatePrice: (id: string, price: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  totalBase: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const base = item.basePrice ?? item.price;
        const existing = get().items.find(
          (i) => i.productId === item.productId && i.variant === item.variant
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === existing.id
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              {
                ...item,
                basePrice: base,
                price: Math.max(item.price, base),
                id: `${item.productId}-${item.variant || "default"}-${Date.now()}`,
                quantity: item.quantity || 1,
              },
            ],
          });
        }
      },
      removeItem: (id) =>
        set({ items: get().items.filter((i) => i.id !== id) }),
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },
      updatePrice: (id, price) => {
        set({
          items: get().items.map((i) => {
            if (i.id !== id) return i;
            const base = i.basePrice ?? i.price;
            return { ...i, price: Math.max(base, price || base) };
          }),
        });
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      totalBase: () =>
        get().items.reduce(
          (sum, i) => sum + (i.basePrice ?? i.price) * i.quantity,
          0
        ),
    }),
    { name: "muqatshop-cart" }
  )
);
