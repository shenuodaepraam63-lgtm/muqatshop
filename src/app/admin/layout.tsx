"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { LogOut, Package, Plus, LayoutDashboard } from "lucide-react";

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

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    document.body.classList.add("admin-mode");
    return () => document.body.classList.remove("admin-mode");
  }, []);

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

  return (
    <div className="min-h-screen bg-[#f8f5f0] flex">
      <aside className="w-56 bg-white border-l border-[#e8e2d9] flex flex-col fixed h-full z-30">
        <div className="p-5 border-b border-[#e8e2d9]">
          <Link href="/admin" className="text-lg font-bold text-ink">
            MUQAT Admin
          </Link>
          <p className="text-xs text-muted mt-1 truncate">{userEmail}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link
            href="/admin"
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              pathname === "/admin"
                ? "bg-[#f0ebe3] text-ink"
                : "text-muted hover:bg-[#f8f5f0]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            لوحة التحكم
          </Link>
          <Link
            href="/admin/products/new"
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              pathname?.includes("/products")
                ? "bg-[#f0ebe3] text-ink"
                : "text-muted hover:bg-[#f8f5f0]"
            }`}
          >
            <Plus className="w-4 h-4" />
            إضافة منتج
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:bg-[#f8f5f0] transition"
          >
            <Package className="w-4 h-4" />
            المنتجات
          </Link>
          <Link
            href="/admin/categories"
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              pathname?.includes("/categories")
                ? "bg-[#f0ebe3] text-ink"
                : "text-muted hover:bg-[#f8f5f0]"
            }`}
          >
            التصنيفات
          </Link>
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
            className="block mt-2 text-center text-xs text-muted hover:text-ink"
          >
            ← العودة للمتجر
          </Link>
        </div>
      </aside>
      <main className="flex-1 mr-56 p-6 md:p-8">{children}</main>
    </div>
  );
}
