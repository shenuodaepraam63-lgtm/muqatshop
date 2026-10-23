import { BrandLogo } from "@/components/brand/BrandLogo";

export function Hero() {
  return (
    <section className="w-full px-4 md:px-8 pt-3 md:pt-5">
      <div className="max-w-page mx-auto relative aspect-[4/5] sm:aspect-[16/10] md:aspect-[21/9] overflow-hidden rounded-2xl md:rounded-3xl bg-[#d0b99b] shadow-sm flex items-center justify-center">
        <BrandLogo size="lg" />
      </div>
    </section>
  );
}
