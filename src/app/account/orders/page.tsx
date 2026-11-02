"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadAccountIdentity } from "@/lib/account-identity";
import {
  fetchCustomerOrders,
  resolveCustomerId,
  type CustomerOrder,
} from "@/lib/customer-account";
import { useLocale } from "@/lib/locale";
import { orderStatusLabel, orderStatusTone } from "@/lib/order-status";
import { formatPrice } from "@/lib/utils";

export default function AccountOrdersPage() {
  const { t, locale } = useLocale();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    (async () => {
      const idRes = await loadAccountIdentity();
      if (!idRes.ok) {
        setErr(t("orders.loginRequired"));
        setLoading(false);
        return;
      }

      const customerId = await resolveCustomerId(idRes.identity);
      const res = await fetchCustomerOrders(customerId, idRes.identity.email);
      if (res.error) setErr(res.error);
      setOrders(res.orders);
      setLoading(false);
    })();
  }, [t]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchQ =
        !q.trim() ||
        o.order_number.toLowerCase().includes(q.trim().toLowerCase());
      const matchS = status === "all" || o.status === status;
      return matchQ && matchS;
    });
  }, [orders, q, status]);

  const statuses = useMemo(() => {
    const set = new Set(orders.map((o) => o.status));
    return Array.from(set);
  }, [orders]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[var(--text)]">{t("orders.title")}</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t("orders.subtitle")}</p>
      </div>

      <div className="account-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("orders.search")}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#3157D5]"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text)]"
        >
          <option value="all">{t("orders.all")}</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {orderStatusLabel(s, locale)}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="h-20 animate-pulse rounded-xl bg-[var(--surface-2)]" />
          <div className="h-20 animate-pulse rounded-xl bg-[var(--surface-2)]" />
        </div>
      )}

      {err && !loading && <p className="text-sm text-[#D64C4C]">{err}</p>}

      {!loading && filtered.length === 0 && (
        <div className="account-card border-dashed px-4 py-10 text-center">
          <p className="font-semibold text-[var(--text)]">{t("orders.empty")}</p>
          <Link href="/shop" className="mt-4 inline-block text-sm font-bold text-[#3157D5]">
            {t("common.shop")}
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {filtered.map((o) => (
          <li key={o.id}>
            <Link
              href={`/account/orders/${o.id}`}
              className="account-card block p-4 transition hover:border-[#C8D6FF]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-sm font-bold text-[var(--text)]">
                  {o.order_number}
                </p>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    orderStatusTone(o.status)
                  }`}
                >
                  {orderStatusLabel(o.status, locale)}
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                {new Date(o.created_at).toLocaleString(
                  locale === "ar" ? "ar-EG" : "en-GB"
                )}{" "}
                · {formatPrice(Number(o.total))}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
