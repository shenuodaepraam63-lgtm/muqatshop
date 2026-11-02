"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
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

export function AdminNotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Row[]>([]);
  const [unread, setUnread] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("admin_notifications")
      .select("id,type,title,body,read_at,created_at,meta")
      .order("created_at", { ascending: false })
      .limit(30);
    const rows = (data as Row[]) || [];
    setItems(rows);
    setUnread(rows.filter((r) => !r.read_at).length);
  }, []);

  useEffect(() => {
    void load();

    // Browser push permission (optional)
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        void Notification.requestPermission();
      }
    }

    const channel = supabase
      .channel("admin-notifications-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          const row = payload.new as Row;
          setItems((prev) => [row, ...prev].slice(0, 30));
          setUnread((n) => n + 1);

          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification(row.title, {
                body: row.body || "",
                tag: row.id,
              });
            } catch {
              /* ignore */
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
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
    const ids = items.filter((i) => !i.read_at).map((i) => i.id);
    if (!ids.length) return;
    await supabase
      .from("admin_notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);
    setItems((prev) =>
      prev.map((i) => ({ ...i, read_at: i.read_at || new Date().toISOString() }))
    );
    setUnread(0);
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
                    {new Date(n.created_at).toLocaleString("ar-EG")}
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
