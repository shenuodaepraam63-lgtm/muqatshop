import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  PackageSearch,
  Heart,
  Search,
  User,
  Store,
  HelpCircle,
  ChevronLeft,
  Package,
} from "lucide-react";

export const metadata = {
  title: "المزيد | Muqatshop",
};

type MoreItem = {
  href: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  disabled?: boolean;
};

type MoreSection = {
  title: string;
  items: MoreItem[];
};

const sections: MoreSection[] = [
  {
    title: "التسوق",
    items: [
      { href: "/shop", label: "المتجر", desc: "كل المنتجات", icon: Store },
      {
        href: "/categories",
        label: "التصنيفات",
        desc: "مجموعات وتصنيفات وفروع",
        icon: PackageSearch,
      },
      { href: "/search", label: "بحث", desc: "ابحث عن منتج", icon: Search },
      {
        href: "/account/wishlist",
        label: "المفضلة",
        desc: "تُفتح داخل الحساب",
        icon: Heart,
      },
    ],
  },
  {
    title: "الطلبات والحساب",
    items: [
      { href: "/account", label: "حسابي", desc: "نظرة عامة على الحساب", icon: User },
      { href: "/account/orders", label: "طلباتي", desc: "قائمة الطلبات", icon: Package },
      { href: "/account/profile", label: "بياناتي", desc: "الاسم والهاتف", icon: User },
      { href: "/account/support", label: "الدعم", desc: "المساعدة والتواصل", icon: HelpCircle },
      { href: "/login", label: "دخول", desc: "تسجيل الدخول الموحد", icon: User },
      { href: "/register", label: "إنشاء حساب", desc: "عميل · مسوق · تاجر", icon: User },
    ],
  },
];

export default function MorePage() {
  return (
    <div className="bg-page min-h-screen">
      <div className="bg-surface-2 text-[11px] tracking-wide text-muted border-b border-border">
        <div className="max-w-page mx-auto px-4 md:px-8 py-2.5 flex gap-1">
          <Link href="/" className="hover:text-ink">
            الرئيسية
          </Link>
          <span>/</span>
          <span className="text-ink">المزيد</span>
        </div>
      </div>

      <div className="max-w-page mx-auto px-4 md:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-ink">المزيد</h1>
        <p className="text-sm text-muted mb-8">روابط إضافية وأقسام في مكان واحد</p>

        <div className="space-y-8">
          {sections.map((sec) => (
            <section key={sec.title}>
              <h2 className="text-xs font-semibold text-muted tracking-wide mb-3">{sec.title}</h2>
              <ul className="rounded-card border border-border bg-white overflow-hidden divide-y divide-border shadow-soft">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const inner = (
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <span className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-ink" strokeWidth={1.5} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-ink">{item.label}</p>
                        <p className="text-xs text-muted truncate">{item.desc}</p>
                      </div>
                      {!item.disabled && <ChevronLeft className="w-4 h-4 text-muted shrink-0" />}
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
                      <Link href={item.href} className="block hover:bg-surface-2/60 transition">
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
