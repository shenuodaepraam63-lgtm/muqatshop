import Link from "next/link";
import {
  PackageSearch,
  Heart,
  Search,
  User,
  Store,
  HelpCircle,
  ChevronLeft,
} from "lucide-react";

export const metadata = {
  title: "المزيد | Muqatshop",
};

const sections = [
  {
    title: "التسوق",
    items: [
      { href: "/shop", label: "المتجر", desc: "كل المنتجات", icon: Store },
      { href: "/categories", label: "التصنيفات", desc: "مجموعات وتصنيفات وفروع", icon: PackageSearch },
      { href: "/search", label: "بحث", desc: "ابحث عن منتج", icon: Search },
      { href: "/wishlist", label: "المفضلة", desc: "قائمة الأمنيات", icon: Heart },
    ],
  },
  {
    title: "الطلبات والحساب",
    items: [
      { href: "/track", label: "تتبع طلب", desc: "حالة شحنتك", icon: PackageSearch },
      { href: "/welcome", label: "دخول / حساب", desc: "عميل أو تاجر", icon: User },
    ],
  },
  {
    title: "قريباً",
    items: [
      {
        href: "#",
        label: "المساعدة والدعم",
        desc: "سيُضاف هنا لاحقاً",
        icon: HelpCircle,
        disabled: true,
      },
    ],
  },
];

export default function MorePage() {
  return (
    <div className="bg-page min-h-screen">
      <div className="bg-[#e8e2d4] text-[11px] tracking-wide uppercase text-muted">
        <div className="max-w-page mx-auto px-4 md:px-8 py-2.5 flex gap-1">
          <Link href="/" className="hover:text-ink">
            الرئيسية
          </Link>
          <span>/</span>
          <span className="text-ink">المزيد</span>
        </div>
      </div>

      <div className="max-w-page mx-auto px-4 md:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">المزيد</h1>
        <p className="text-sm text-muted mb-8">
          روابط إضافية وأقسام سنضيفها لاحقاً في مكان واحد
        </p>

        <div className="space-y-8">
          {sections.map((sec) => (
            <section key={sec.title}>
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                {sec.title}
              </h2>
              <ul className="rounded-2xl border border-[#eae6df] bg-white overflow-hidden divide-y divide-[#f0ebe3]">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const inner = (
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <span className="w-10 h-10 rounded-xl bg-[#f5f1e8] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-ink" strokeWidth={1.5} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-ink">{item.label}</p>
                        <p className="text-xs text-muted truncate">{item.desc}</p>
                      </div>
                      {!item.disabled && (
                        <ChevronLeft className="w-4 h-4 text-muted shrink-0" />
                      )}
                    </div>
                  );
                  if (item.disabled) {
                    return (
                      <li key={item.label} className="opacity-50">
                        {inner}
                      </li>
                    );
                  }
                  return (
                    <li key={item.href + item.label}>
                      <Link href={item.href} className="block hover:bg-[#faf9f6] transition">
                        {inner}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
