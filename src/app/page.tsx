import { Hero } from "@/components/home/Hero";

export default function HomePage() {
  return (
    <div>
      <Hero />

      {/* المنتجات هتظهر هنا بعد ربط Supabase + Cloudinary */}
      <section className="max-w-page mx-auto px-4 md:px-8 mt-12 md:mt-16 mb-16">
        <div className="rounded-media bg-card py-16 px-6 text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-3">قريباً</h2>
          <p className="text-muted max-w-md mx-auto text-sm">
            جاري تجهيز المنتجات. سيتم عرض الكتالوج هنا تلقائياً بعد إضافة المنتجات من لوحة التحكم.
          </p>
        </div>
      </section>
    </div>
  );
}
