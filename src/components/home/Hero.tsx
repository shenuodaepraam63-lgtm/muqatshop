import Link from "next/link";
import { LOGO_DATA_URI } from "@/lib/logo";

export function Hero() {
  return (
    <section className="relative w-full px-4 md:px-8 pt-4 md:pt-6">
      <div className="relative max-w-page mx-auto overflow-hidden rounded-media bg-card aspect-[16/9] md:aspect-[21/9] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#e8e4d4] via-[#ede9d9] to-[#d9d4c4]" />

        <div className="relative z-10 text-center px-6 py-12 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_DATA_URI}
            alt="Muqatshop"
            width={280}
            height={120}
            className="h-24 md:h-36 w-auto object-contain mb-2"
          />
          <Link
            href="/collections"
            className="inline-block border border-ink text-ink px-8 py-3 rounded-btn text-sm font-semibold tracking-wide hover:bg-ink hover:text-page transition-colors duration-300 mt-4"
          >
            اكتشف المجموعة
          </Link>
        </div>
      </div>
    </section>
  );
}
