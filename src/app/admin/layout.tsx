"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  LogOut,
  Package,
  Plus,
  LayoutDashboard,
  Menu,
  X,
  ShoppingBag,
  Tags,
} from "lucide-react";

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

  const isLoginPage = pathname === "/admin/login";

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

    checkAuth();

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

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5f0]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  const navLink = (
    href: string,
    label: string,
    icon: React.ReactNode,
    active?: boolean
  ) => (
    <Link
      href={href}
      onClick={() => setMenuOpen(false)}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
        active ? "bg-[#f0ebe3] text-ink" : "text-muted hover:bg-[#f8f5f0]"
      }`}
    >
      {icon}
      {label}
    </Link>
  );

  const sidebar = (
    <>
      <div className="p-5 border-b border-[#e8e2d9]">
        <Link
          href="/admin"
          className="text-lg font-bold text-ink"
          onClick={() => setMenuOpen(false)}
        >
          MUQAT Admin
        </Link>
        <p className="text-xs text-muted mt-1 truncate">{userEmail}</p>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navLink(
          "/admin",
          "لوحة التحكم",
          <LayoutDashboard className="w-4 h-4" />,
          pathname === "/admin"
        )}
        {navLink(
          "/admin/orders",
          "الطلبات",
          <ShoppingBag className="w-4 h-4" />,
          pathname?.startsWith("/admin/orders")
        )}
        {navLink(
          "/admin/products/new",
          "إضافة منتج",
          <Plus className="w-4 h-4" />,
          pathname === "/admin/products/new"
        )}
        {navLink(
          "/admin",
          "المنتجات",
          <Package className="w-4 h-4" />,
          pathname === "/admin"
        )}
        {navLink(
          "/admin/categories",
          "التصنيفات",
          <Tags className="w-4 h-4" />,
          pathname?.includes("/categories")
        )}
      </nav>
      <div className="p-3 border-t border-[#e8e2d9]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </button>
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="block mt-2 text-center text-xs text-muted hover:text-ink"
        >
          ← العودة للمتجر
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-[#e8e2d9] h-14 flex items-center justify-between px-4">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="p-2 -mr-2 rounded-lg hover:bg-[#f8f5f0]"
          aria-label="فتح القائمة"
        >
          <Menu className="w-6 h-6 text-ink" />
        </button>
        <Link href="/admin" className="font-bold text-ink text-sm">
          MUQAT Admin
        </Link>
        <div className="w-10" />
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`
          w-64 bg-white border-l border-[#e8e2d9] flex flex-col fixed h-full z-[60]
          transition-transform duration-200 ease-out
          md:translate-x-0 md:z-30
          ${
            menuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
          }
        `}
      >
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          className="md:hidden absolute top-3 left-3 p-2 rounded-lg hover:bg-[#f8f5f0]"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebar}
      </aside>

      <main className="md:mr-64 p-4 sm:p-6 md:p-8 min-h-screen">{children}</main>
    </div>
  );
}
