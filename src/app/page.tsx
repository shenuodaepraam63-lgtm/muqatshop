import { Hero } from "@/components/home/Hero";
import { ProductCard } from "@/components/home/ProductCard";

const demoProducts = [
  {
    id: "1",
    name: "مقطف كلاسيك جلد طبيعي",
    slug: "classic-leather-bag",
    price: 899,
    compareAtPrice: 1200,
    image: "",
  },
  {
    id: "2",
    name: "حقيبة يد أنيقة",
    slug: "elegant-handbag",
    price: 650,
    compareAtPrice: null,
    image: "",
  },
  {
    id: "3",
    name: "مقطف سفر كبير",
    slug: "travel-tote",
    price: 1100,
    compareAtPrice: 1450,
    image: "",
  },
  {
    id: "4",
    name: "حقيبة كروس بودي",
    slug: "crossbody-bag",
    price: 480,
    compareAtPrice: null,
    image: "",
  },
];

export default function HomePage() {
  return (
    <div>
      <Hero />

      <section className="max-w-page mx-auto px-4 md:px-8 mt-12 md:mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold">وصل حديثاً</h2>
          <a
            href="/collections/new"
            className="text-sm text-muted hover:text-ink transition"
          >
            عرض الكل ←
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {demoProducts.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      </section>

      <section className="max-w-page mx-auto px-4 md:px-8 mt-16 mb-8">
        <div className="rounded-media bg-card py-16 px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">مجموعة المقاطف</h2>
          <p className="text-muted max-w-md mx-auto mb-6">
            تصاميم مختارة بعناية تناسب كل يومك، من الكلاسيك إلى العصري.
          </p>
          <a
            href="/collections/bags"
            className="inline-block bg-ink text-page px-8 py-3 rounded-btn text-sm font-semibold hover:opacity-90 transition"
          >
            تسوق المقاطف
          </a>
        </div>
      </section>
    </div>
  );
}
