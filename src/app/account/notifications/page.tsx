"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { loadAccountIdentity } from "@/lib/account-identity";
import { resolveCustomerId } from "@/lib/customer-account";
import { useLocale } from "@/lib/locale";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  order_id: string | null;
  read_at: string | null;
  created_at: string;
};

export default function AccountNotificationsPage() {
  const { t, locale } = useLocale();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const idRes = await loadAccountIdentity();
      if (!idRes.ok) {
        setErr(t("orders.loginRequired"));
        setItems([]);
        return;
      }
      const customerId = await resolveCustomerId(idRes.identity);
      const email = idRes.identity.email.toLowerCase().trim();

      let q = supabase
        .from("customer_notifications")
        .select("id, title, body, order_id, read_at, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (customerId) {
        q = q.or(`customer_id.eq.${customerId},customer_email.eq.${email}`);
      } else {
        q = q.eq("customer_email", email);
      }

      const { data, error } = await q;
      if (error) {
        setErr(error.message);
        setItems([]);
        return;
      }
      setItems((data || []) as Notif[]);
    } catch {
      setErr(t("loading"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (id: string) => {
    await supabase
      .from("customer_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text)]">
            {t("notifications.title")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm font-semibold text-[#3157D5]"
        >
          {t("notifications.refresh")}
        </button>
      </div>

      {loading && <p className="text-sm text-[var(--text-muted)]">{t("loading")}</p>}
      {err && <p className="text-sm text-[#D64C4C]">{err}</p>}

      {!loading && items.length === 0 && !err && (
        <div className="account-card border-dashed px-4 py-12 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" strokeWidth={1.5} />
          <p className="font-semibold text-[var(--text)]">{t("notifications.empty")}</p>
          <Link
            href="/account/orders"
            className="mt-4 inline-block text-sm font-bold text-[#3157D5]"
          >
            {t("nav.orders")}
          </Link>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((n) => (
          <li
            key={n.id}
            className={`account-card px-4 py-3 ${
              n.read_at ? "" : "border-[#D9E4FF] bg-[#F5F8FF] dark:bg-[#152238]"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-[var(--text)]">{n.title}</p>
                {n.body && (
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{n.body}</p>
                )}
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  {new Date(n.created_at).toLocaleString(
                    locale === "ar" ? "ar-EG" : "en-GB"
                  )}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {n.order_id && (
                  <Link
                    href={`/account/orders/${n.order_id}`}
                    className="text-xs font-semibold text-[#3157D5]"
                  >
                    {t("notifications.view")}
                  </Link>
                )}
                {!n.read_at && (
                  <button
                    type="button"
                    onClick={() => void markRead(n.id)}
                    className="text-[11px] text-[var(--text-muted)] underline"
                  >
                    {t("notifications.markRead")}
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
