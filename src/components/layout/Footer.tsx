import Link from "next/link";
import { ArrowUpLeft, Mail, MapPin, MessageCircle, ShoppingBag } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

const columns = [
  {
    title: "التسوق",
    links: [
      { label: "الرئيسية", href: "/" },
      { label: "جميع المنتجات", href: "/shop" },
      { label: "التصنيفات", href: "/categories" },
      { label: "المفضلة", href: "/account/wishlist" },
    ],
  },
  {
    title: "حساب العميل",
    links: [
      { label: "حسابي", href: "/account" },
      { label: "طلباتي", href: "/account/orders" },
      { label: "عناويني", href: "/account/addresses" },
      { label: "الدعم والمساعدة", href: "/account/support" },
    ],
  },
  {
    title: "الشراكات",
    links: [
      { label: "إنشاء حساب تاجر", href: "/register/supplier" },
      { label: "إنشاء حساب مسوق", href: "/register/affiliate" },
      { label: "تتبع طلب", href: "/track" },
      { label: "الأسئلة الشائعة", href: "/#faq" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[#E4E9F0] bg-white text-[#14243A]">
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-10 md:grid-cols-[1.35fr_repeat(3,1fr)]">
          <div>
            <Link href="/" aria-label="Muqatshop — الصفحة الرئيسية" className="inline-flex">
              <BrandLogo size="md" tone="navy" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-[#718096]">
              تجربة تسوق واضحة تجمع المنتجات والطلبات وخدمة العملاء في مكان واحد.
            </p>
            <div className="mt-5 space-y-2 text-sm text-[#526174]">
              <a href="mailto:muqatshop@gmail.com" className="flex items-center gap-2 transition hover:text-[#3157D5]">
                <Mail className="h-4 w-4 text-[#3157D5]" />
                muqatshop@gmail.com
              </a>
              <a href="https://wa.me/201229660142" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition hover:text-[#18A999]">
                <MessageCircle className="h-4 w-4 text-[#18A999]" />
                تواصل عبر واتساب
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#3157D5]" />
                شحن إلى جميع محافظات مصر
              </span>
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
                <ShoppingBag className="h-4 w-4 text-[#3157D5]" />
                {column.title}
              </h2>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="group inline-flex items-center gap-1 text-sm text-[#718096] transition hover:text-[#3157D5]">
                      {link.label}
                      <ArrowUpLeft className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[#E4E9F0] bg-[#F6F8FB]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-4 text-xs text-[#718096] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <span>تسوق بثقة مع Muqatshop</span>
          <span>© {new Date().getFullYear()} Muqatshop — جميع الحقوق محفوظة.</span>
        </div>
      </div>
    </footer>
  );
}
