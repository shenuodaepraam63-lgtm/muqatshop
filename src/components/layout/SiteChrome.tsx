"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";

/** يخفي الهيدر/الفوتر في صفحات الدخول */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare =
    pathname === "/welcome" ||
    pathname?.startsWith("/welcome") ||
    pathname === "/merchant/login" ||
    pathname === "/merchant/register";

  if (bare) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="min-h-[70vh] pb-20 md:pb-0">{children}</main>
      <Footer />
      <BottomNav />
    </>
  );
}
