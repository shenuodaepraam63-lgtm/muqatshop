"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  Heart,
  Languages,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Package,
  PanelRightClose,
  PanelRightOpen,
  Settings,
  Store,
  Sun,
  User,
  X,
} from "lucide-react";
import {
  loadAccountIdentity,
  mirrorLegacySession,
  type AccountIdentity,
} from "@/lib/account-identity";
import { signOutToHome } from "@/lib/auth-session";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";
import { AccountFloatingChrome } from "@/components/account/AccountFloatingChrome";

type NavItem = {
  href: string;
  labelKey: string;
  icon: typeof Package;
  exact?: boolean;
};

const GROUPS: { titleKey: string; items: NavItem[] }[] = [
  {
    titleKey: "nav.group.shopping",
    items: [
      { href: "/account", labelKey: "nav.overview", icon: LayoutDashboard, exact: true },
      { href: "/account/orders", labelKey: "nav.orders", icon: Package },
      { href: "/account/wishlist", labelKey: "nav.wishlist", icon: Heart },
    ],
  },
  {
    titleKey: "nav.group.account",
    items: [
      { href: "/account/profile", labelKey: "nav.profile", icon: User },
      { href: "/account/addresses", labelKey: "nav.addresses", icon: MapPin },
      { href: "/account/settings", labelKey: "nav.settings", icon: Settings },
    ],
  },
  {
    titleKey: "nav.group.contact",
    items: [
      { href: "/account/notifications", labelKey: "nav.notifications", icon: Bell },
      { href: "/account/support", labelKey: "nav.support", icon: LifeBuoy },
    ],
  },
];

function isNavActive(pathname: string | null, href: string, exact?: boolean) {
  if (!pathname) return false;
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, setLocale, dir } = useLocale();
  const { resolved, toggle } = useTheme();
  const [identity, setIdentity] = useState<AccountIdentity | null>(null);
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "nav.group.shopping": true,
    "nav.group.account": true,
    "nav.group.contact": true,
  });
  const [accountMenu, setAccountMenu] = useState(false);

  const isPending = Boolean(pathname?.startsWith("/account/pending"));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await loadAccountIdentity();
      if (cancelled) return;
      if (!res.ok) {
        if (isPending) {
          setReady(true);
          return;
        }
        router.replace(`/login?next=${encodeURIComponent(pathname || "/account")}`);
        return;
      }
      mirrorLegacySession(res.identity);
      setIdentity(res.identity);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, router, isPending]);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY && y > 64) setHeaderHidden(true);
      else setHeaderHidden(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const logout = async () => {
    await signOutToHome();
  };

  if (isPending) {
    if (!ready) {
      return (
        <div className="grid min-h-[50vh] place-items-center bg-[var(--page-bg)] text-sm text-[var(--text-muted)]">
          {t("loading")}
        </div>
      );
    }
    return <>{children}</>;
  }

  if (!ready || !identity) {
    return (
      <div className="grid min-h-[50vh] place-items-center bg-[var(--page-bg)] text-sm text-[var(--text-muted)]">
        {t("loading")}
      </div>
    );
  }

  const name = identity.fullName || identity.email.split("@")[0];
  const initials = name.trim().slice(0, 1).toUpperCase();

  const NavLinks = ({ compact }: { compact?: boolean }) => (
    <div className="space-y-3">
      {GROUPS.map((group) => {
        const open = openGroups[group.titleKey] !== false;
        return (
          <div key={group.titleKey}>
            {!compact && (
              <button
                type="button"
                onClick={() =>
                  setOpenGroups((g) => ({
                    ...g,
                    [group.titleKey]: !open,
                  }))
                }
                className="mb-1 flex w-full items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]"
              >
                {t(group.titleKey)}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition ${open ? "" : "-rotate-90"}`}
                />
              </button>
            )}
            {(compact || open) &&
              group.items.map(({ href, labelKey, icon: Icon, exact }) => {
                const active = isNavActive(pathname, href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={t(labelKey)}
                    className={`relative mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-[#3157D5] text-white dark:bg-[#5B7CFA]"
                        : "text-[var(--text-soft)] hover:bg-[var(--surface-2)]"
                    } ${compact ? "justify-center px-2" : ""}`}
                  >
                    {active && !compact && (
                      <span className="absolute inset-y-2 end-0 w-1 rounded-s bg-white/90" />
                    )}
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    {!compact && <span className="truncate">{t(labelKey)}</span>}
                  </Link>
                );
              })}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="account-shell min-h-screen" dir={dir}>
      {/* Header — not sticky; hides on scroll down */}
      <header
        className={`border-b border-[var(--border)] bg-[var(--card-bg)] transition-transform duration-300 ${
          headerHidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-3 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--border)] lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Muqatshop" width={28} height={28} />
              <span className="hidden text-sm font-bold text-[var(--text)] sm:inline">
                Muqatshop
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-2 text-xs font-semibold text-[var(--text-soft)] hover:border-[#3157D5] hover:text-[#3157D5]"
            >
              <Store className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("header.store")}</span>
            </Link>
            <Link
              href="/account/notifications"
              className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-soft)] hover:text-[#3157D5]"
              aria-label={t("nav.notifications")}
            >
              <Bell className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
              className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-soft)]"
              aria-label={t("header.lang")}
              title={locale === "ar" ? "English" : "العربية"}
            >
              <Languages className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={toggle}
              className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-soft)]"
              aria-label={t("header.theme")}
            >
              {resolved === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountMenu((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] py-1.5 ps-1.5 pe-2"
              >
                <span className="grid h-8 w-8 place-items-center rounded-md bg-[#3157D5] text-xs font-bold text-white">
                  {initials}
                </span>
                <span className="hidden max-w-[8rem] truncate text-xs font-semibold text-[var(--text)] sm:inline">
                  {name}
                </span>
              </button>
              {accountMenu && (
                <div className="absolute end-0 z-40 mt-2 w-44 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-lg">
                  <Link
                    href="/account/profile"
                    className="block px-3 py-2.5 text-sm hover:bg-[var(--surface-2)]"
                    onClick={() => setAccountMenu(false)}
                  >
                    {t("nav.profile")}
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold text-[#D64C4C] hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("nav.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1280px] gap-0 px-0 sm:px-4 lg:gap-6 lg:px-6 lg:py-6">
        {/* Desktop sidebar */}
        <aside
          className={`sticky top-4 hidden shrink-0 self-start lg:block ${
            collapsed ? "w-[72px]" : "w-[240px]"
          }`}
        >
          <div className="account-card p-3">
            <div className={`mb-3 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
              {!collapsed && (
                <p className="text-xs font-bold text-[#3157D5]">{t("header.account")}</p>
              )}
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="grid h-8 w-8 place-items-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                aria-label="Collapse"
              >
                {collapsed ? (
                  <PanelRightOpen className="h-4 w-4" />
                ) : (
                  <PanelRightClose className="h-4 w-4" />
                )}
              </button>
            </div>
            <NavLinks compact={collapsed} />
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 end-0 flex w-[min(100%,300px)] flex-col bg-[var(--card-bg)] shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <span className="text-sm font-bold">{t("header.account")}</span>
                <button type="button" onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <NavLinks />
              </div>
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-4 px-3 py-4 sm:px-2 lg:px-0 lg:py-0">
          {children}
          <footer className="border-t border-[var(--border)] pt-4 text-center text-[11px] text-[var(--text-muted)]">
            © {new Date().getFullYear()} Muqatshop
          </footer>
        </div>
      </div>

      <AccountFloatingChrome />
    </div>
  );
}
