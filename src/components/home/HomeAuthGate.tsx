"use client";

import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { StorePageSkeleton } from "@/components/ui/StorePageSkeleton";

type AuthState = "loading" | "authenticated" | "anonymous";

/**
 * Switches root "/" content by real Supabase session.
 * Server-rendered children are passed in to avoid duplicating pages.
 */
export function HomeAuthGate({
  store,
  marketing,
}: {
  store: ReactNode;
  marketing: ReactNode;
}) {
  const [state, setState] = useState<AuthState>("loading");

  useEffect(() => {
    let cancelled = false;

    const applySession = (hasUser: boolean) => {
      if (cancelled) return;
      setState(hasUser ? "authenticated" : "anonymous");
    };

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          applySession(false);
          return;
        }
        applySession(!!data.session?.user);
      } catch {
        applySession(false);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(!!session?.user);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (state === "loading") {
    return <StorePageSkeleton />;
  }

  return <>{state === "authenticated" ? store : marketing}</>;
}
