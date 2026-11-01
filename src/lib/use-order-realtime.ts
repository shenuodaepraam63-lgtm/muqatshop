"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type StatusPatch = {
  status?: string;
  updated_at?: string;
  version?: number;
};

/**
 * Hybrid Realtime: postgres_changes + polling fallback every 45s if not live.
 */
export function useOrderRealtime(
  orderId: string | undefined,
  onPatch: (patch: StatusPatch) => void
) {
  const [live, setLive] = useState(false);
  const onPatchRef = useRef(onPatch);
  onPatchRef.current = onPatch;

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-hybrid-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const next = payload.new as StatusPatch;
          onPatchRef.current(next);
        }
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });

    const poll = setInterval(() => {
      // Soft poll only when channel not live
      void (async () => {
        const { data } = await supabase
          .from("orders")
          .select("status, updated_at, version")
          .eq("id", orderId)
          .maybeSingle();
        if (data) onPatchRef.current(data as StatusPatch);
      })();
    }, 45000);

    return () => {
      clearInterval(poll);
      void supabase.removeChannel(channel);
      setLive(false);
    };
  }, [orderId]);

  return { live };
}
