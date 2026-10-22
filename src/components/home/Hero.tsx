import { supabase } from "@/lib/supabase";
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
        <div className="max-w-page mx-auto rounded-2xl bg-[#ebe6dc] aspect-[16/9] flex items-center justify-center text-muted text-sm">
          أضف صور المعرض من لوحة التحكم ← معرض الصور
        </div>
      </section>
    );
  }

  return (
    <GalleryCarousel
      slides={slides}
      settings={{
        enabled: settings.enabled !== false,
        template: (settings.template as "rounded_carousel" | "fade" | "peek" | "full") || "rounded_carousel",
        autoplay: settings.autoplay !== false,
        interval_ms: Number(settings.interval_ms) || 4000,
      }}
    />
  );
}
