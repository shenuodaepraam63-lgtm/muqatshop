export type CcNavItem = {
  href: string;
  labelAr: string;
  labelEn: string;
  icon: string;
  implemented: boolean;
};

export type CcNavGroup = {
  id: string;
  labelAr: string;
  labelEn: string;
  items: CcNavItem[];
};

/** Control Center navigation — only mark implemented routes as live. */
export const CC_NAV: CcNavGroup[] = [
  {
    id: "main",
    labelAr: "الرئيسية",
    labelEn: "Main",
    items: [
      {
        href: "/admin",
        labelAr: "نظرة عامة",
        labelEn: "Overview",
        icon: "overview",
        implemented: true,
      },
    ],
  },
  {
    id: "analytics",
    labelAr: "التحليلات والإحصائيات",
    labelEn: "Analytics",
    items: [
      {
        href: "/admin/analytics/visitors",
        labelAr: "إحصائيات الزائرين",
        labelEn: "Visitors",
        icon: "visitors",
        implemented: true,
      },
      {
        href: "/admin/analytics/customers",
        labelAr: "إحصائيات المستخدمين",
        labelEn: "Customers analytics",
        icon: "users",
        implemented: true,
      },
      {
        href: "/admin/analytics/orders",
        labelAr: "إحصائيات الطلبات",
        labelEn: "Orders analytics",
        icon: "orders-chart",
        implemented: true,
      },
      {
        href: "/admin/analytics/period",
        labelAr: "اليوم والأسبوع",
        labelEn: "Daily & weekly",
        icon: "calendar",
        implemented: true,
      },
    ],
  },
  {
    id: "store",
    labelAr: "إدارة المتجر",
    labelEn: "Store",
    items: [
      {
        href: "/admin/customers",
        labelAr: "إدارة العملاء",
        labelEn: "Customers",
        icon: "customers",
        implemented: true,
      },
      {
        href: "/admin/orders",
        labelAr: "إدارة الطلبات",
        labelEn: "Orders",
        icon: "orders",
        implemented: true,
      },
      {
        href: "/admin/products",
        labelAr: "إدارة المنتجات",
        labelEn: "Products",
        icon: "products",
        implemented: true,
      },
      {
        href: "/admin/categories",
        labelAr: "إدارة التصنيفات",
        labelEn: "Categories",
        icon: "categories",
        implemented: true,
      },
      {
        href: "/admin/campaigns",
        labelAr: "الحملات",
        labelEn: "Campaigns",
        icon: "campaigns",
        implemented: true,
      },
      {
        href: "/admin/coupons",
        labelAr: "الكوبونات",
        labelEn: "Coupons",
        icon: "coupons",
        implemented: true,
      },
    ],
  },
  {
    id: "system",
    labelAr: "النظام",
    labelEn: "System",
    items: [
      {
        href: "/admin/announcement",
        labelAr: "إعدادات المتجر",
        labelEn: "Store settings",
        icon: "settings",
        implemented: true,
      },
      {
        href: "/admin/homepage",
        labelAr: "الصفحة الرئيسية",
        labelEn: "Homepage",
        icon: "home",
        implemented: true,
      },
      {
        href: "/admin/gallery",
        labelAr: "معرض الصور",
        labelEn: "Gallery",
        icon: "gallery",
        implemented: true,
      },
    ],
  },
];

export function pageTitleForPath(pathname: string | null, locale: "ar" | "en"): string {
  if (!pathname) return locale === "ar" ? "نظرة عامة" : "Overview";
  for (const g of CC_NAV) {
    for (const item of g.items) {
      if (
        pathname === item.href ||
        (item.href !== "/admin" && pathname.startsWith(item.href))
      ) {
        return locale === "ar" ? item.labelAr : item.labelEn;
      }
    }
  }
  if (pathname.startsWith("/admin/products"))
    return locale === "ar" ? "المنتجات" : "Products";
  if (pathname.startsWith("/admin/orders"))
    return locale === "ar" ? "الطلبات" : "Orders";
  return locale === "ar" ? "لوحة التحكم" : "Control Center";
}
