import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import "./globals.css";
import "./homepage.css";
import { MerchantRefCaptureGate } from "@/components/layout/MerchantRefCaptureGate";
import { RoleGate } from "@/components/auth/RoleGate";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";
import { CartOwnerSync } from "@/components/cart/CartOwnerSync";
import { ThemeProvider } from "@/lib/theme";
import { LocaleProvider } from "@/lib/locale";
import { MotionProvider } from "@/components/animations/MotionProvider";

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${arabic.variable} ${inter.variable} font-sans antialiased`}
        style={
          {
            ["--font-cairo" as string]: "var(--font-arabic)",
            ["--font-changa" as string]: "var(--font-arabic)",
          } as React.CSSProperties
        }
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mq-theme');var d=document.documentElement;var dark=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);d.classList.toggle('dark',dark);d.style.colorScheme=dark?'dark':'light';var l=localStorage.getItem('mq-locale');if(l==='en'){d.lang='en';d.dir='ltr'}else{d.lang='ar';d.dir='rtl'}}catch(e){}})();`,
          }}
        />
        <ThemeProvider>
          <LocaleProvider>
            <MotionProvider>
              <AuthSessionProvider>
                <CartOwnerSync />
                <MerchantRefCaptureGate />
                <RoleGate>
                  <SiteChrome>{children}</SiteChrome>
                </RoleGate>
              </AuthSessionProvider>
            </MotionProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
