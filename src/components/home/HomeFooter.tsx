import Link from "next/link";
import { ArrowUpLeft, Mail, Store, ShoppingBag, Users } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

const columns = [
  {
    title: "المتجر",
    icon: ShoppingBag,
    links: [
      { label: "الرئيسية", href: "/" },
      { label: "جميع المنتجات", href: "/shop" },
      { label: "التصنيفات", href: "/categories" },
      { label: "تتبع طلب", href: "/track" },
    ],
  },
  {
    title: "الشراكات",
    icon: Store,
    links: [
      { label: "إنشاء حساب تاجر", href: "/register/supplier" },
      { label: "إنشاء حساب مسوق", href: "/register/affiliate" },
      { label: "تسجيل الدخول", href: "/login" },
      { label: "كيف تعمل المنصة؟", href: "/#how-it-works" },
    ],
  },
  {
    title: "المساعدة",
    icon: Users,
    links: [
      { label: "الأسئلة الشائعة", href: "/#faq" },
      { label: "الخصوصية والاستفسارات", href: "mailto:muqatshop@gmail.com?subject=%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%AE%D8%B5%D9%88%D8%B5%D9%8A%D8%A9" },
      { label: "تتبع طلب", href: "/track" },
      { label: "تواصل معنا", href: "mailto:muqatshop@gmail.com" },
    ],
  },
];

export function HomeFooter({ email }: { email: string }) {
  return (
    <footer className="border-t border-[#E4E9F0] bg-white">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <Link href="/" aria-label="Muqatshop — الرئيسية" className="inline-flex">
            <BrandLogo size="sm" tone="navy" />
          </Link>
          <p className="max-w-xs text-sm leading-7 text-[#718096]">
            منصة تجمع بين التسوق والتجارة والتسويق في مكان واحد.
          </p>
          <a href={`mailto:${email}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#3157D5]">
            <Mail className="h-4 w-4" />
            {email}
          </a>
        </div>
        {columns.map((column) => {
          const Icon = column.icon;
          return (
            <div key={column.title}>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-[#14243A]">
                <Icon className="h-4 w-4 text-[#3157D5]" />
                {column.title}
              </h2>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-[#718096] transition hover:text-[#3157D5]"
                    >
                      {link.label}
                      <ArrowUpLeft className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="border-t border-[#E4E9F0]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-4 text-xs text-[#718096] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <span>Your Style. Your Choice.</span>
          <span>© {new Date().getFullYear()} Muqatshop — جميع الحقوق محفوظة.</span>
        </div>
      </div>
    </footer>
  );
}
