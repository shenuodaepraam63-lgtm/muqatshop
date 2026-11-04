"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AdminNotificationsBell } from "@/components/admin/AdminNotificationsBell";
import { CC_NAV, pageTitleForPath } from "@/components/admin/cc/cc-nav";
import { CcIcon } from "@/components/admin/cc/CcIcons";
import { LogOut, Menu, PanelLeftClose, PanelLeft, X } from "lucide-react";

const ADMIN_EMAIL = "muqatshop@gmail.com";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isLoginPage = pathname === "/admin/login";
  const pageTitle = useMemo(
    () => pageTitleForPath(pathname, "ar"),
    [pathname]
  );

  useEffect(() => {
    document.body.classList.add("admin-mode");
    return () => document.body.classList.remove("admin-mode");
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || session.user.email !== ADMIN_EMAIL) {
        router.replace("/admin/login");
        return;
      }
      setUserEmail(session.user.email ?? null);
      setLoading(false);
    };

    void checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session || session.user.email !== ADMIN_EMAIL) {
        router.replace("/admin/login");
      } else {
        setUserEmail(session.user.email ?? null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isLoginPage, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8FB]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#14243A] border-t-transparent" />
          <p className="text-sm text-[#718096]">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const sidebarInner = (
    <>
      <div className={`border-b border-[#E4E9F0] ${collapsed ? "p-3" : "p-4"}`}>
        <div className="flex items-center justify-between gap-2">
          {!collapsed && (
            <Link href="/admin" className="inline-flex min-w-0" onClick={() => setMenuOpen(false)}>
              <BrandLogo size="sm" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="hidden rounded-lg p-2 text-[#718096] hover:bg-[#F6F8FB] md:inline-flex"
            aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
        {!collapsed && (
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[#718096]">
            Control Center
          </p>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {CC_NAV.map((group) => (
          <div key={group.id}>
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                {group.labelAr}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items
                .filter((i) => i.implemented)
                .map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.labelAr}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-medium transition ${
                        active
                          ? "bg-[#E8EEFB] text-[#3157D5]"
                          : "text-[#475569] hover:bg-[#F6F8FB] hover:text-[#14243A]"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      <CcIcon name={item.icon} className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.labelAr}</span>}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#E4E9F0] p-3">
        {!collapsed && userEmail && (
          <p className="mb-2 truncate px-1 text-[11px] text-[#718096]">{userEmail}</p>
        )}
        <button
          type="button"
          onClick={() => void handleLogout()}
          className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-sm font-medium text-[#D64C4C] hover:bg-red-50 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "تسجيل الخروج"}
        </button>
      </div>
    </>
  );

  const sidebarWidth = collapsed ? "md:w-[72px]" : "md:w-64";
  const mainOffset = collapsed ? "md:mr-[72px]" : "md:mr-64";

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#202B3C]">
      {/* Mobile top */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#E4E9F0] bg-white px-3 md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="rounded-lg p-2 hover:bg-[#F6F8FB]"
          aria-label="فتح القائمة"
        >
          <Menu className="h-5 w-5 text-[#14243A]" />
        </button>
        <span className="text-sm font-bold">{pageTitle}</span>
        <AdminNotificationsBell />
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-[60] flex h-full flex-col border-l border-[#E4E9F0] bg-white transition-all duration-200 md:z-30 ${
          sidebarWidth
        } ${menuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}
      >
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          className="absolute left-2 top-2 rounded-lg p-2 hover:bg-[#F6F8FB] md:hidden"
          aria-label="إغلاق"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarInner}
      </aside>

      {/* Desktop top bar */}
      <div
        className={`sticky top-0 z-20 hidden border-b border-[#E4E9F0] bg-white/95 backdrop-blur md:block ${mainOffset}`}
      >
        <div className="flex h-14 items-center justify-between gap-4 px-6">
          <div className="min-w-0">
            <p className="text-[11px] text-[#718096]">Control Center / Muqatshop</p>
            <h1 className="truncate text-base font-bold text-[#14243A]">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <AdminNotificationsBell />
            <div className="hidden rounded-xl border border-[#E4E9F0] px-3 py-1.5 text-xs text-[#718096] lg:block">
              {userEmail}
            </div>
          </div>
        </div>
      </div>

      <main className={`${mainOffset} min-h-screen p-4 sm:p-6 md:p-8`}>
        {children}
      </main>
    </div>
  );
}
