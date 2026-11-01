"use client";

/** Guest may browse the cart. Auth is enforced only on checkout (CheckoutForm). */
export function CartGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
