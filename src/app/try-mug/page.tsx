import Link from "next/link";
import { MugPreview } from "@/components/product/MugPreview";

export const metadata = {
  title: "جرّب المج | Muqatshop",
  description: "ارفع صورتك وشوفها على المج قبل الشراء — الصورة تبقى على جهازك فقط",
};

export default async function TryMugPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; name?: string }>;
}) {
  const sp = await searchParams;
  const slug = sp.product?.trim() || undefined;
  const name = sp.name ? decodeURIComponent(sp.name) : undefined;

  return (
    <div className="bg-page min-h-screen pb-24">
      <div className="bg-[#e8e2d4] text-[11px] tracking-wide uppercase text-muted">
        <div className="max-w-page mx-auto px-4 md:px-8 py-2.5 flex flex-wrap gap-1 items-center">
          <Link href="/" className="hover:text-ink">
            الرئيسية
          </Link>
          <span>/</span>
          {slug && (
            <>
              <Link href={`/products/${slug}`} className="hover:text-ink">
                المنتج
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-ink">جرّب المج</span>
        </div>
      </div>

      <div className="max-w-page mx-auto px-4 md:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-ink">جرّب المج قبل الشراء</h1>
          <p className="text-sm text-muted mt-2 max-w-md mx-auto">
            ارفع أي صورة وشوف شكلها مطبوعة على المج. المعاينة بتتم على جهازك — مفيش رفع لسيرفرنا.
          </p>
        </div>

        <MugPreview productName={name} productSlug={slug} />
      </div>
    </div>
  );
}
