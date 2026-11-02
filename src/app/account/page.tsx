"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Heart,
  LifeBuoy,
  MapPin,
  Package,
  Settings,
  User,
} from "lucide-react";
import { loadAccountIdentity } from "@/lib/account-identity";
import {
  fetchCustomerOrders,
  resolveCustomerId,
  type CustomerOrder,
} from "@/lib/customer-account";
import { useLocale } from "@/lib/locale";
import { orderStatusLabel, orderStatusTone } from "@/lib/order-status";
import { formatPrice } from "@/lib/utils";

export default function AccountOverviewPage() {
  const { t, locale } = useLocale();
  const [name, setName] = useState("");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const idRes = await loadAccountIdentity();
      if (!idRes.ok) return;
      setName(idRes.identity.fullName || idRes.identity.email.split("@")[0]);
      const customerId = await resolveCustomerId(idRes.identity);
      const { orders: list } = await fetchCustomerOrders(
        customerId,
        idRes.identity.email
      );
      setOrders(list);
      setLoading(false);
    })();
  }, []);

  const firstName = useMemo(() => {
    const n = name.trim();
    if (!n) return locale === "ar" ? "عميلنا" : "there";
    return n.split(/\s+/)[0];
  }, [name, locale]);

  const isReturning = !loading && orders.length > 0;
  const isNew = !loading && orders.length === 0;

  const todayLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date());
    } catch {
      return new Date().toLocaleDateString();
    }
  }, [locale]);

  const welcomeTitle = (isReturning ? t("welcome.returnTitle") : t("welcome.newTitle")).replace(
    "{name}",
    firstName
  );
  const welcomeBody = isReturning ? t("welcome.returnBody") : t("welcome.newBody");

  const active = orders.filter(
    (o) => !["delivered", "cancelled", "rejected"].includes(o.status)
  );
  const delivered = orders.filter((o) => o.status === "delivered");
  const latest = orders[0];

  return (
    <div className="space-y-5">
      <section className="account-card animate-fade-in-up p-5 sm:p-6">
        <p className="text-xs font-bold text-[#3157D5] dark:text-[#5B7CFA]">
          {t("nav.overview")}
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{todayLabel}</p>
        <h2 className="mt-2 text-xl font-bold text-[var(--text)] sm:text-2xl">
          {loading ? t("loading") : welcomeTitle}
          {!loading && isNew ? " ✨" : ""}
          {!loading && isReturning ? " 👋" : ""}
        </h2>
        <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
          {loading ? "…" : welcomeBody}
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t("overview.statsAll")}
          value={loading ? "—" : String(orders.length)}
        />
        <StatCard
          label={t("overview.statsActive")}
          value={loading ? "—" : String(active.length)}
        />
        <StatCard
          label={t("overview.statsDelivered")}
          value={loading ? "—" : String(delivered.length)}
        />
      </div>

      <section className="account-card p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[var(--text)]">
            {t("overview.latest")}
          </h3>
          <Link
            href="/account/orders"
            className="text-xs font-semibold text-[#3157D5]"
          >
            {t("overview.allOrders")}
          </Link>
        </div>
        {loading ? (
          <div className="h-20 animate-pulse rounded-xl bg-[var(--surface-2)]" />
        ) : !latest ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-4 py-8 text-center">
            <p className="text-sm font-semibold text-[var(--text)]">
              {t("overview.empty")}
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {t("overview.emptyHint")}
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-flex rounded-lg bg-[#3157D5] px-4 py-2 text-xs font-bold text-white"
            >
              {locale === "ar" ? "تسوق الآن" : "Shop now"}
            </Link>
          </div>
        ) : (
          <Link
            href={`/account/orders/${latest.id}`}
            className="block rounded-xl border border-[var(--border)] p-4 transition hover:border-[#C8D6FF]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-sm font-bold text-[var(--text)]">
                {latest.order_number}
              </p>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  orderStatusTone(latest.status)
                }`}
              >
                {orderStatusLabel(latest.status)}
              </span>
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {new Date(latest.created_at).toLocaleString(
                locale === "ar" ? "ar-EG" : "en-GB"
              )}{" "}
              · {formatPrice(Number(latest.total))}
            </p>
          </Link>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink href="/account/orders" icon={Package} title={t("nav.orders")} />
        <QuickLink href="/account/addresses" icon={MapPin} title={t("nav.addresses")} />
        <QuickLink href="/account/profile" icon={User} title={t("nav.profile")} />
        <QuickLink href="/account/wishlist" icon={Heart} title={t("nav.wishlist")} />
        <QuickLink
          href="/account/notifications"
          icon={Bell}
          title={t("nav.notifications")}
        />
        <QuickLink href="/account/support" icon={LifeBuoy} title={t("nav.support")} />
        <QuickLink href="/account/settings" icon={Settings} title={t("nav.settings")} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="account-card p-4">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--text)]">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
}: {
  href: string;
  icon: typeof Package;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="account-card p-4 transition hover:border-[#C8D6FF]"
    >
      <span className="inline-grid h-10 w-10 place-items-center rounded-lg bg-[#EEF3FF] text-[#3157D5] dark:bg-[#1a2744] dark:text-[#5B7CFA]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <p className="mt-3 text-sm font-bold text-[var(--text)]">{title}</p>
    </Link>
  );
}
