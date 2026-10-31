import type { Metadata } from "next";
import { Cairo, Changa, Inter } from "next/font/google";
import "./globals.css";
import "./homepage.css";
import { MerchantRefCaptureGate } from "@/components/layout/MerchantRefCaptureGate";
import { RoleGate } from "@/components/auth/RoleGate";
import { SiteChrome } from "@/components/layout/SiteChrome";

const changa = Changa({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-changa",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-inter",
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${changa.variable} ${cairo.variable} ${inter.variable} font-sans antialiased`}>
        <MerchantRefCaptureGate />
        <RoleGate>
          <SiteChrome>{children}</SiteChrome>
        </RoleGate>
      </body>
    </html>
  );
}
