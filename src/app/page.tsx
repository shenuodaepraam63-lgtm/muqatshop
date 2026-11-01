import type { Metadata } from "next";
import { HomeAuthGate } from "@/components/home/HomeAuthGate";
import MarketingHomePage from "@/components/home/MarketingHomePage";
import StoreHomePage from "@/components/home/StoreHomePage";
import "@/app/homepage.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://muqatshop.vercel.app"),
  title: "Muqatshop | تسوق منتجات متنوعة",
  description:
    "اكتشف منتجات Muqatshop، تصفح التصنيفات والعروض، وأتمم طلبك بسهولة. منصة للتسوق والتجارة والتسويق.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Muqatshop",
    description: "متجر ومنصة تجارة إلكترونية — منتجات وعروض حقيقية.",
    url: "https://muqatshop.vercel.app/",
    locale: "ar_EG",
    type: "website",
  },
};

/**
 * Root "/":
 * - anonymous → platform intro (existing HomeSections marketing page)
 * - signed in → current store homepage (unchanged)
 */
export default function HomePage() {
  return (
    <HomeAuthGate
      marketing={<MarketingHomePage />}
      store={<StoreHomePage />}
    />
  );
}
