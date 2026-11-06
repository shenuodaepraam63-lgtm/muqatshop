"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock3,
  Heart,
  LifeBuoy,
  MapPin,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
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
    let cancelled = false;
    (async () => {
      try {
        const idRes = await loadAccountIdentity();
        if (!idRes.ok) return;
        if (cancelled) return;
        setName(idRes.identity.fullName || idRes.identity.email.split("@")[0]);
        const customerId = await resolveCustomerId(idRes.identity);
        const { orders: list } = await fetchCustomerOrders(
          customerId,
          idRes.identity.email
        );
        if (!cancelled) setOrders(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = useMemo(() => {
    const n = name.trim();
    if (!n) return locale === "ar" ? "عميلنا" : "there";
    return n.split(/\s+/)[0];
  }, [name, locale]);

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

  const isReturning = !loading && orders.length > 0;
  const welcomeTitle = t(isReturning ? "welcome.returnTitle" : "welcome.newTitle", {
    name: firstName,
  });
  const welcomeBody = t(isReturning ? "welcome.returnBody" : "welcome.newBody");
  const active = orders.filter(
    (o) => !["delivered", "cancelled", "rejected"].includes(o.status)
  );
  const delivered = orders.filter((o) => o.status === "delivered");
  const latest = orders[0];

  return (
    <div className="account-overview space-y-5 sm:space-y-6">
      <section className="relative isolate overflow-hidden rounded-[26px] bg-[linear-gradient(125deg,#101d35_0%,#1d3763_58%,#3157d5_100%)] px-5 py-6 text-white shadow-[0_18px_48px_rgba(20,36,58,0.16)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -end-16 -top-24 -z-10 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -end-4 -top-12 -z-10 h-44 w-44 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 start-1/3 -z-10 h-52 w-52 rounded-full bg-[#8da7ff]/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/85 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#f5d98a]" />
              {t("nav.overview")}
            </div>
            <p className="mt-4 text-xs font-medium text-white/60">{todayLabel}</p>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
              {loading ? t("loading") : welcomeTitle}
              {!loading && (orders.length ? " 👋" : " ✨")}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/75 sm:text-[15px]">
              {loading ? "…" : welcomeBody}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href="/shop"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f5d98a] px-4 text-sm font-extrabold text-[#172640] shadow-lg shadow-black/10 transition hover:bg-[#ffe8a9]"
            >
              <ShoppingBag className="h-4 w-4" />
              {t("common.shop")}
            </Link>
            <Link
              href="/account/orders"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15"
            >
              {t("nav.orders")}
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label={t("nav.overview")}>
        <StatCard
          icon={Package}
          label={t("overview.statsAll")}
          value={loading ? "—" : String(orders.length)}
          tone="blue"
        />
        <StatCard
          icon={Clock3}
          label={t("overview.statsActive")}
          value={loading ? "—" : String(active.length)}
          tone="amber"
        />
        <StatCard
          icon={CheckCircle2}
          label={t("overview.statsDelivered")}
          value={loading ? "—" : String(delivered.length)}
          tone="green"
        />
      </section>

      <section className="account-card overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-bold tracking-wide text-[#3157D5] dark:text-[#8da7ff]">
              {t("nav.orders")}
            </p>
            <h2 className="mt-1 text-base font-extrabold text-[var(--text)]">
              {t("overview.latest")}
            </h2>
          </div>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#3157D5] transition hover:gap-2 dark:text-[#8da7ff]"
          >
            {t("overview.allOrders")}
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="h-24 animate-pulse rounded-xl bg-[var(--surface-2)]" />
          ) : !latest ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-4 py-9 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--card-bg)] text-[#3157D5] shadow-sm dark:text-[#8da7ff]">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-bold text-[var(--text)]">{t("overview.empty")}</p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-6 text-[var(--text-muted)]">
                {t("overview.emptyHint")}
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#3157D5] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#2648b8]"
              >
                {t("common.shop")}
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <Link
              href={`/account/orders/${latest.id}`}
              className="group flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 transition hover:border-[#aabdf8] hover:shadow-[0_12px_30px_rgba(49,87,213,0.08)] sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eef3ff] text-[#3157D5] dark:bg-[#1a2744] dark:text-[#8da7ff]">
                  <Package className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-extrabold text-[var(--text)]">
                    {latest.order_number}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {new Date(latest.created_at).toLocaleString(
                      locale === "ar" ? "ar-EG" : "en-GB"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="sm:text-end">
                  <p className="text-sm font-extrabold text-[var(--text)]">
                    {formatPrice(Number(latest.total))}
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${orderStatusTone(latest.status)}`}
                  >
                    {orderStatusLabel(latest.status)}
                  </span>
                </div>
                <ArrowLeft className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition group-hover:-translate-x-1 group-hover:text-[#3157D5]" />
              </div>
            </Link>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-[11px] font-bold tracking-wide text-[#3157D5] dark:text-[#8da7ff]">
              {t("header.account")}
            </p>
            <h2 className="mt-1 text-base font-extrabold text-[var(--text)]">
              {t("nav.overview")}
            </h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickLink href="/account/orders" icon={Package} title={t("nav.orders")} />
          <QuickLink href="/account/wishlist" icon={Heart} title={t("nav.wishlist")} />
          <QuickLink href="/account/addresses" icon={MapPin} title={t("nav.addresses")} />
          <QuickLink href="/account/profile" icon={User} title={t("nav.profile")} />
          <QuickLink href="/account/notifications" icon={Bell} title={t("nav.notifications")} />
          <QuickLink href="/account/support" icon={LifeBuoy} title={t("nav.support")} />
          <QuickLink href="/account/settings" icon={Settings} title={t("nav.settings")} />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  tone: "blue" | "amber" | "green";
}) {
  const tones = {
    blue: "bg-[#eef3ff] text-[#3157d5] dark:bg-[#1b2b4d] dark:text-[#91a9ff]",
    amber: "bg-[#fff6df] text-[#9a6b0b] dark:bg-[#3b2d13] dark:text-[#f5d98a]",
    green: "bg-[#e9f8f1] text-[#16845b] dark:bg-[#15372c] dark:text-[#78d6ae]",
  };

  return (
    <div className="account-card flex items-center gap-4 rounded-2xl p-4 sm:p-5">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[var(--text-muted)]">{label}</p>
        <p className="mt-1 text-2xl font-extrabold leading-none text-[var(--text)] tabular-nums">
          {value}
        </p>
      </div>
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
      className="group account-card flex items-center gap-3 rounded-2xl p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#b7c7f8] hover:shadow-[0_12px_28px_rgba(20,36,58,0.07)]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)] text-[#3157D5] transition group-hover:bg-[#eef3ff] dark:text-[#8da7ff] dark:group-hover:bg-[#1a2744]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--text)]">
        {title}
      </span>
      <ArrowLeft className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition group-hover:-translate-x-1 group-hover:text-[#3157D5]" />
    </Link>
  );
}
