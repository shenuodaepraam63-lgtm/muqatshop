import Link from "next/link";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative w-full px-4 md:px-8 pt-4 md:pt-6">
      <div className="relative max-w-page mx-auto overflow-hidden rounded-media bg-card aspect-[16/9] md:aspect-[21/9] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#e8e4d4] via-[#ede9d9] to-[#d9d4c4]" />

        <div className="relative z-10 text-center px-6 py-12 flex flex-col items-center">
          <Image
            src="/logo.webp"
            alt="Muqatshop"
            width={280}
            height={120}
            className="h-20 md:h-28 w-auto object-contain mb-4"
            priority
          />
          <p className="text-sm md:text-base tracking-[0.15em] text-muted mb-8">
            Your Style. Your Choice.
          </p>
          <Link
            href="/collections"
            className="inline-block border border-ink text-ink px-8 py-3 rounded-btn text-sm font-semibold tracking-wide hover:bg-ink hover:text-page transition-colors duration-300"
          >
            اكتشف المجموعة
          </Link>
        </div>
      </div>
    </section>
  );
}
