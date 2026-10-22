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
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    // Hide store header/footer when in admin
    document.body.classList.add("admin-mode");
    return () => document.body.classList.remove("admin-mode");
  }, []);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.email !== ADMIN_EMAIL) {
        router.replace("/admin/login");
        return;
      }
      setUser(session.user);
      setLoading(false);
    };
    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session || session.user.email !== ADMIN_EMAIL) {
        router.replace("/admin/login");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [pathname, router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCEE]">
        <div className="text-muted">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3eb]">
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-bold text-ink">
              Muqat Admin
            </Link>
            <nav className="hidden sm:flex items-center gap-4 text-sm">
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 ${pathname === "/admin" ? "text-ink font-medium" : "text-muted hover:text-ink"}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                المنتجات
              </Link>
              <Link
                href="/admin/products/new"
                className={`flex items-center gap-1.5 ${pathname?.includes("/new") ? "text-ink font-medium" : "text-muted hover:text-ink"}`}
              >
                <Plus className="w-4 h-4" />
                إضافة منتج
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted hidden sm:inline">{user?.email}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-ink transition"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
