"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getMerchantSession } from "@/lib/merchant";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  isMerchant: boolean;
  /** true when customer or merchant can act as signed-in buyer */
  canPurchase: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [isMerchant, setIsMerchant] = useState(false);

  const refresh = useCallback(async () => {
    const merchant = Boolean(getMerchantSession());
    setIsMerchant(merchant);
    const { data } = await supabase.auth.getSession();
    const s = data.session ?? null;
    setSession(s);
    setStatus(s?.user || merchant ? "authenticated" : "unauthenticated");
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await refresh();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      const merchant = Boolean(getMerchantSession());
      setIsMerchant(merchant);
      setStatus(s?.user || merchant ? "authenticated" : "unauthenticated");
    });

    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      isMerchant,
      canPurchase: status === "authenticated",
      refresh,
    }),
    [status, session, isMerchant, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthSession(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      status: "loading",
      session: null,
      user: null,
      isMerchant: false,
      canPurchase: false,
      refresh: async () => {},
    };
  }
  return ctx;
}
