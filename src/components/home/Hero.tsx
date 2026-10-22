import Link from "next/link";

export function Hero() {
  return (
    <section className="relative w-full px-4 md:px-8 pt-4 md:pt-6">
      <div className="relative max-w-page mx-auto overflow-hidden rounded-media bg-card aspect-[16/9] md:aspect-[21/9] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#e8e4d4] via-[#ede9d9] to-[#d9d4c4]" />

        <div className="relative z-10 text-center px-6 py-12">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-ink mb-3">
            MUQAT
          </h1>
          <p className="text-lg md:text-2xl font-medium text-ink/80 italic mb-2">
            Made For You
          </p>
          <p className="text-sm md:text-base tracking-[0.2em] uppercase text-muted mb-8">
            Where Elegance Meets Everyday
          </p>
          <Link
            href="/collections"
            className="inline-block border border-ink text-ink px-8 py-3 rounded-btn text-sm font-semibold tracking-wide hover:bg-ink hover:text-page transition-colors duration-300"
          >
            اكتشف الآن
          </Link>
        </div>
      </div>
    </section>
  );
}
