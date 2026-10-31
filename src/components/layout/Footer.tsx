import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function Footer() {
  return (
    <footer className="bg-surface-2 border-t border-border mt-16">
      <div className="max-w-page mx-auto px-4 md:px-8 py-12 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <Link href="/" aria-label="Muqatshop — الصفحة الرئيسية" className="inline-flex mb-4">
              <BrandLogo size="md" />
            </Link>
            <p className="text-sm text-muted leading-relaxed max-w-xs">
              تصميمك، قصتك — توصيل لكل محافظات مصر بجودة عالية وتجربة شراء سهلة.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-ink mb-4 text-sm">روابط سريعة</h4>
            <ul className="space-y-2.5 text-sm text-muted">
              <li>
                <Link href="/shop" className="hover:text-brand-dark transition">
                  جميع المنتجات
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-brand-dark transition">
                  التصنيفات
                </Link>
              </li>
              <li>
                <Link href="/more" className="hover:text-brand-dark transition">
                  المزيد
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-brand-dark transition">
                  تتبع طلب
                </Link>
              </li>
              <li>
                <Link href="/register/affiliate" className="hover:text-brand-dark transition">
                  سجّل كمسوق
                </Link>
              </li>
              <li>
                <Link href="/register/supplier" className="hover:text-brand-dark transition">
                  سجّل كتاجر
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-ink mb-4 text-sm">خدمة العملاء</h4>
            <ul className="space-y-2.5 text-sm text-muted">
              <li>شحن لكل محافظات مصر</li>
              <li>توصيل مجاني للطلبات فوق 1000 ج.م</li>
              <li>الدفع عند الاستلام متاح</li>
              <li>تواصل عبر واتساب</li>
              <li>
                <Link href="/login" className="hover:text-brand-dark transition">
                  تسجيل الدخول
                </Link>
              </li>
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
