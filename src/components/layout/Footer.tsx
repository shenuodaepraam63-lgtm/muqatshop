import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="max-w-page mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-xl font-bold mb-3">MUQAT SHOP</h3>
            <p className="text-muted text-sm leading-relaxed">
              متجر متخصص في المقاطف والحقائب والمنتجات الأنيقة. نصمم ونختار لك قطعاً تدوم.
            </p>
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
          © {new Date().getFullYear()} Muqat Shop. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
