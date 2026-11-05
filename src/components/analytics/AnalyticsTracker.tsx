"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

function newEventKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function post(path: string, body: Record<string, unknown>) {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    return res.json().catch(() => ({}));
  } catch {
    return {};
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const sessionIdRef = useRef<string | null>(null);
  const lastPathRef = useRef<string>("");

  // skip admin shell noise lightly
  const skip =
    pathname?.startsWith("/admin") || pathname?.startsWith("/adminm");

  useEffect(() => {
    if (skip) return;
    let cancelled = false;

    (async () => {
      await post("/api/analytics/identify", {});
      if (cancelled) return;
      const s = await post("/api/analytics/session", {
        entry_path: pathname || "/",
      });
      if (s?.session_id) sessionIdRef.current = s.session_id as string;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token && sessionIdRef.current) {
        await fetch("/api/analytics/link-account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ session_id: sessionIdRef.current }),
          credentials: "same-origin",
        }).catch(() => undefined);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [skip]);

  useEffect(() => {
    if (skip || !pathname) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    const productMatch = pathname.match(/^\/products\/([^/]+)/);
    void (async () => {
      if (!sessionIdRef.current) {
        const s = await post("/api/analytics/session", {
          entry_path: pathname,
        });
        if (s?.session_id) sessionIdRef.current = s.session_id as string;
      }

      await post("/api/analytics/event", {
        event_key: newEventKey(),
        event_type: "page_view",
        path: pathname,
        session_id: sessionIdRef.current,
      });

      // product by slug — resolve optional later; path-only page_view is enough for path stats
      if (productMatch) {
        await post("/api/analytics/event", {
          event_key: newEventKey(),
          event_type: "product_view",
          path: pathname,
          session_id: sessionIdRef.current,
          metadata: { slug: decodeURIComponent(productMatch[1]) },
        });
      }
    })();
  }, [pathname, skip]);

  useEffect(() => {
    if (skip) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (!sessionIdRef.current) return;
      void post("/api/analytics/heartbeat", {
        session_id: sessionIdRef.current,
      }).then((r) => {
        if (r?.reason === "SESSION_EXPIRED" || r?.reason === "SESSION_ENDED") {
          sessionIdRef.current = null;
        }
      });
    }, 30000);
    return () => window.clearInterval(id);
  }, [skip]);

  useEffect(() => {
    if (skip) return;
    const onHide = () => {
      if (!sessionIdRef.current) return;
      const body = JSON.stringify({
        session_id: sessionIdRef.current,
        exit_path: lastPathRef.current || pathname,
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/analytics/end-session",
          new Blob([body], { type: "application/json" })
        );
      }
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [pathname, skip]);

  return null;
}
