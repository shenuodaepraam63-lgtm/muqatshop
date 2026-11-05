"use client";

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { adminMutate } from "@/lib/admin-mutate";
import { supabase } from "@/lib/supabase";

type Row = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
  meta?: { order_number?: string } | null;
};

class BellErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function AdminNotificationsBellInner() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Row[]>([]);
  const [unread, setUnread] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("id,type,title,body,read_at,created_at,meta")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        setItems([]);
        setUnread(0);
        return;
      }

      const rows = Array.isArray(data) ? (data as Row[]) : [];
      setItems(rows);
      setUnread(rows.filter((r) => !r.read_at).length);
    } catch {
      setItems([]);
      setUnread(0);
    }
  }, []);

  useEffect(() => {
    void load();

    try {
      if (typeof window !== "undefined" && typeof Notification !== "undefined") {
        if (Notification.permission === "default") {
          void Notification.requestPermission().catch(() => undefined);
        }
      }
    } catch {
      /* WebView / restricted browsers */
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(`admin-notifications-feed-${Math.random().toString(36).slice(2, 8)}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "admin_notifications" },
          (payload) => {
            try {
              const row = payload.new as Row;
              if (!row?.id) return;
              setItems((prev) => [row, ...prev].slice(0, 30));
              setUnread((n) => n + 1);

              try {
                if (
                  typeof Notification !== "undefined" &&
                  Notification.permission === "granted"
                ) {
                  new Notification(row.title || "إشعار جديد", {
                    body: row.body || "",
                    tag: row.id,
                  });
                }
              } catch {
                /* ignore notification API failures */
              }
            } catch {
              /* ignore payload handling */
            }
          }
        )
        .subscribe();
    } catch {
      channel = null;
    }

    return () => {
      if (channel) {
        try {
          void supabase.removeChannel(channel);
        } catch {
          /* ignore */
        }
      }
    };
  }, [load]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const markAllRead = async () => {
    try {
      const ids = items.filter((i) => !i.read_at).map((i) => i.id);
      if (!ids.length) return;
      await Promise.all(
        ids.map((id) =>
          adminMutate({
            table: "admin_notifications",
            op: "update",
            id,
            data: { read_at: new Date().toISOString() },
          })
        )
      );
      setItems((prev) =>
        prev.map((i) => ({
          ...i,
          read_at: i.read_at || new Date().toISOString(),
        }))
      );
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-10 w-10 place-items-center rounded-lg hover:bg-[#f8f5f0]"
        aria-label="الإشعارات"
      >
        <Bell className="h-5 w-5 text-ink" />
        {unread > 0 && (
          <span className="absolute top-1 left-1 grid min-w-[18px] place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[min(92vw,340px)] overflow-hidden rounded-xl border border-[#e8e2d9] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#e8e2d9] px-3 py-2">
            <p className="text-sm font-bold text-ink">الإشعارات</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-[11px] font-semibold text-[#3157D5]"
              >
                تعليم الكل كمقروء
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-muted">
                لا إشعارات بعد
              </li>
            )}
            {items.map((n) => (
              <li
                key={n.id}
                className={`border-b border-[#f0ebe3] px-3 py-2.5 ${
                  n.read_at ? "" : "bg-[#fff8ee]"
                }`}
              >
                <p className="text-sm font-semibold text-ink">{n.title}</p>
                {n.body && (
                  <p className="mt-0.5 whitespace-pre-line text-xs text-muted">
                    {n.body}
                  </p>
                )}
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-muted">
                    {n.created_at
                      ? new Date(n.created_at).toLocaleString("ar-EG")
                      : ""}
                  </span>
                  {n.type === "new_order" && n.meta?.order_number && (
                    <Link
                      href="/admin/orders"
                      className="text-[11px] font-bold text-[#3157D5]"
                      onClick={() => setOpen(false)}
                    >
                      الطلبات
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AdminNotificationsBell() {
  return (
    <BellErrorBoundary>
      <AdminNotificationsBellInner />
    </BellErrorBoundary>
  );
}
