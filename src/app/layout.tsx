import type { Metadata } from "next";
import { Changa } from "next/font/google";
import "./globals.css";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";

const changa = Changa({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-changa",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Muqat Shop | متجر المقاطف الأنيق",
  description:
    "متجر متخصص في المقاطف والحقائب والمنتجات الأنيقة. جودة عالية، تصميم فريد، وشحن لكل مصر.",
  openGraph: {
    title: "Muqat Shop",
    description: "متجر المقاطف والمنتجات الأنيقة",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${changa.variable} font-sans antialiased`}>
        <AnnouncementBar />
        <Header />
        <main className="min-h-[70vh] pb-20 md:pb-0">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
