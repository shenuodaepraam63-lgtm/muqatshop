"use client";

import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

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
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center bg-[#F6F8FB]"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-full bg-[#D9E4FF]" />
          <p className="text-sm text-[#718096]">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return <>{state === "authenticated" ? store : marketing}</>;
}
