import { supabase } from "@/lib/supabase";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { GalleryCarousel, type GallerySlide } from "./GalleryCarousel";

async function getGallery() {
  const [{ data: slides }, { data: settingsRow }] = await Promise.all([
    supabase
      .from("gallery_slides")
      .select("id, title, subtitle, image_url, link_url, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("site_settings").select("value").eq("key", "gallery").maybeSingle(),
  ]);

  return {
    slides: (slides as GallerySlide[]) || [],
    settings: (settingsRow?.value as Record<string, unknown>) || {},
  };
}

export async function Hero() {
  const { slides, settings } = await getGallery();

  if (slides.length === 0) {
    return (
      <section className="w-full px-4 md:px-8 pt-4">
        <div className="max-w-page mx-auto rounded-card overflow-hidden relative aspect-[4/5] sm:aspect-[16/10] md:aspect-[21/9] flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-[#2c1810] via-[#5c3a24] to-[#8B5E34] shadow-card">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_30%_20%,#C4A574,transparent_50%)]" />
          <div className="relative z-10 scale-110">
            <BrandLogo size="lg" />
          </div>
          <div className="relative z-10 text-center px-6 space-y-2">
            <p className="text-white/90 text-sm sm:text-base font-medium">
              تصميمك، قصتك — شحن لكل مصر
            </p>
            <a
              href="/shop"
              className="inline-flex mt-2 bg-white text-ink font-semibold text-sm px-6 py-2.5 rounded-btn shadow-soft hover:bg-page transition"
            >
              تسوق الآن
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <GalleryCarousel
      slides={slides}
      settings={{
        enabled: settings.enabled !== false,
        template:
          (settings.template as "rounded_carousel" | "fade" | "peek" | "full") ||
          "rounded_carousel",
        autoplay: settings.autoplay !== false,
        interval_ms: Number(settings.interval_ms) || 4000,
      }}
    />
  );
}
