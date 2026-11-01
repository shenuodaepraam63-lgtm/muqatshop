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
  /** owner of current cart snapshot — guest = null */
  ownerUserId: string | null;
  addItem: (item: AddCartItemInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updatePrice: (id: string, price: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  totalBase: () => number;
  /** Call after login: attach cart to user; after logout switch to guest without leaking items to next user */
  bindOwner: (userId: string | null) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      ownerUserId: null,
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
      bindOwner: (userId) => {
        const current = get().ownerUserId;
        // Switching to a different logged-in user → start empty (privacy)
        if (userId && current && userId !== current) {
          set({ items: [], ownerUserId: userId });
          return;
        }
        // Login from guest: keep items, stamp owner
        if (userId && !current) {
          set({ ownerUserId: userId });
          return;
        }
        // Logout: keep items as guest cart for continuity of shopping
        if (!userId) {
          set({ ownerUserId: null });
          return;
        }
        set({ ownerUserId: userId });
      },
    }),
    { name: "muqatshop-cart" }
  )
);
