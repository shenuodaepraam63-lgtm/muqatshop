import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="max-w-page mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <Link href="/" aria-label="Muqatshop — الصفحة الرئيسية" className="inline-flex mb-4">
              <BrandLogo size="md" />
            </Link>
          </div>

          <div>
            <h4 className="font-semibold mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/collections" className="hover:text-ink transition">
                  جميع المنتجات
                </Link>
              </li>
              <li>
                <Link href="/collections/bags" className="hover:text-ink transition">
                  مقاطف
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-ink transition">
                  عن المتجر
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-ink transition">
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">خدمة العملاء</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>شحن لكل محافظات مصر</li>
              <li>الدفع عند الاستلام متاح</li>
              <li>تواصل عبر واتساب</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted">
          © {new Date().getFullYear()} Muqatshop. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
