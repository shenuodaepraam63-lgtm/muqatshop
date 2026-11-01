"use client";

import { useEffect } from "react";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { useCartStore } from "@/lib/store";

/** Keeps cart ownerUserId aligned with auth session */
export function CartOwnerSync() {
  const { status, user } = useAuthSession();
  const bindOwner = useCartStore((s) => s.bindOwner);

  useEffect(() => {
    if (status === "loading") return;
    bindOwner(user?.id ?? null);
  }, [status, user?.id, bindOwner]);

  return null;
}
