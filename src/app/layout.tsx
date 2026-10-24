import type { Metadata } from "next";
import { Changa } from "next/font/google";
import "./globals.css";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { MerchantRefCaptureGate } from "@/components/layout/MerchantRefCaptureGate";

const changa = Changa({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-changa",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Muqatshop | Your Style. Your Choice.",
  description:
    "متجر متخصص في المقاطف والحقائب والمنتجات الأنيقة. جودة عالية، تصميم فريد، وشحن لكل مصر.",
  openGraph: {
    title: "Muqatshop",
    description: "Your Style. Your Choice.",
    type: "website",
  },
  icons: {
    icon: "/logo.svg",
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
        <MerchantRefCaptureGate />
        <AnnouncementBar />
        <Header />
        <main className="min-h-[70vh] pb-20 md:pb-0">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
