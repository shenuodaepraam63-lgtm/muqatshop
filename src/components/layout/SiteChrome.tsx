"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";

const AUTH_BARE = [
  "/welcome",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/account",
  "/affiliate/pending",
  "/supplier/pending",
];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  if (pathname === "/") return <>{children}</>;

  const bare =
    AUTH_BARE.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/merchant") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin");

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
