"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppLocale = "ar" | "en";

type LocaleCtx = {
  locale: AppLocale;
  dir: "rtl" | "ltr";
  setLocale: (l: AppLocale) => void;
  t: (key: string, vars?: Record<string, string>) => string;
};

const LocaleContext = createContext<LocaleCtx | null>(null);
const STORAGE_KEY = "mq-locale";

const MESSAGES: Record<AppLocale, Record<string, string>> = {
  ar: {
    "nav.overview": "نظرة عامة",
    "nav.orders": "طلباتي",
    "nav.addresses": "عناويني",
    "nav.profile": "بياناتي الشخصية",
    "nav.wishlist": "المفضلة",
    "nav.notifications": "الإشعارات",
    "nav.support": "الدعم والمساعدة",
    "nav.settings": "إعدادات الحساب",
    "nav.logout": "تسجيل الخروج",
    "nav.group.shopping": "التسوق",
    "nav.group.account": "الحساب",
    "nav.group.contact": "التواصل",
    "header.store": "المتجر",
    "header.account": "حسابي",
    "header.theme": "المظهر",
    "header.lang": "اللغة",
    "welcome.newTitle": "أهلاً بك، {name}",
    "welcome.newBody":
      "مرحبًا بك في منصة Muqatshop. ابدأ رحلتك واكتشف تجربة تسوق مختلفة.",
    "welcome.returnTitle": "أهلاً بعودتك، {name}",
    "welcome.returnBody":
      "سعداء بوجودك مجددًا. كل شيء جاهز لتكمل تجربة تسوقك.",
    "overview.statsAll": "كل الطلبات",
    "overview.statsActive": "قيد التنفيذ",
    "overview.statsDelivered": "مُسلَّمة",
    "overview.latest": "آخر طلب",
    "overview.allOrders": "كل الطلبات",
    "overview.empty": "لا توجد طلبات بعد",
    "overview.emptyHint":
      "الطلبات المرتبطة بحسابك تظهر هنا بعد إتمام الشراء وأنت مسجّل الدخول.",
    "support.float": "دعم",
    "backTop": "أعلى",
    "loading": "جاري التحميل...",
    "orders.title": "طلباتي",
    "orders.subtitle": "تتبع ومتابعة كل طلباتك",
    "orders.search": "بحث برقم الطلب",
    "orders.all": "الكل",
    "orders.empty": "لا توجد طلبات",
    "orders.loginRequired": "يجب تسجيل الدخول لعرض الطلبات",
    "addresses.title": "عناويني",
    "addresses.subtitle": "احفظ عناوين التوصيل لاستخدامها لاحقًا",
    "addresses.linkFailed": "تعذر ربط حساب العميل",
    "addresses.required": "أكمل الاسم والهاتف والمحافظة والمركز",
    "addresses.updated": "تم تحديث العنوان",
    "addresses.added": "تم إضافة العنوان",
    "addresses.deleteConfirm": "حذف هذا العنوان؟",
    "addresses.default": "افتراضي",
    "addresses.setDefault": "تعيين افتراضي",
    "addresses.edit": "تعديل",
    "addresses.delete": "حذف",
    "addresses.empty": "لا توجد عناوين محفوظة بعد",
    "addresses.editTitle": "تعديل عنوان",
    "addresses.addTitle": "إضافة عنوان",
    "addresses.label": "تسمية (المنزل / العمل)",
    "addresses.fullName": "الاسم الكامل *",
    "addresses.phone": "الهاتف *",
    "addresses.phoneAlt": "هاتف احتياطي",
    "addresses.governorate": "المحافظة *",
    "addresses.center": "المركز *",
    "addresses.centerFirst": "اختر المحافظة أولاً",
    "addresses.area": "المنطقة",
    "addresses.street": "الشارع",
    "addresses.apartment": "الشقة / المبنى",
    "addresses.asDefault": "تعيين كعنوان افتراضي",
    "addresses.saveEdit": "حفظ التعديل",
    "addresses.add": "إضافة العنوان",
    "addresses.cancel": "إلغاء",
    "addresses.unnamed": "عنوان",
    "profile.title": "بياناتي الشخصية",
    "profile.subtitle": "تحديث الاسم ورقم الهاتف المرتبطين بالحساب",
    "profile.name": "الاسم",
    "profile.phone": "الهاتف",
    "profile.save": "حفظ",
    "profile.saving": "جاري الحفظ...",
    "profile.saved": "تم حفظ بياناتك",
    "wishlist.title": "المفضلة",
    "wishlist.empty": "لا توجد منتجات في المفضلة",
    "notifications.title": "الإشعارات",
    "notifications.empty": "لا توجد إشعارات",
    "notifications.refresh": "تحديث",
    "notifications.markRead": "تعليم كمقروء",
    "notifications.view": "عرض",
    "support.title": "الدعم والمساعدة",
    "support.subtitle": "تواصل فوري عبر واتساب مع فريق Muqatshop",
    "support.topic": "الموضوع",
    "support.orderOptional": "رقم الطلب (اختياري)",
    "settings.title": "إعدادات الحساب",
    "settings.subtitle": "الأمان والوصول وإدارة الجلسة",
    "settings.account": "الحساب",
    "settings.email": "البريد",
    "settings.type": "نوع الحساب",
    "settings.session": "الجلسة",
    "settings.logout": "تسجيل الخروج",
    "common.retry": "إعادة المحاولة",
    "common.shop": "تسوق الآن",
    "common.cancel": "إلغاء",
  },
  en: {
    "nav.overview": "Overview",
    "nav.orders": "My orders",
    "nav.addresses": "Addresses",
    "nav.profile": "Profile",
    "nav.wishlist": "Wishlist",
    "nav.notifications": "Notifications",
    "nav.support": "Support",
    "nav.settings": "Settings",
    "nav.logout": "Sign out",
    "nav.group.shopping": "Shopping",
    "nav.group.account": "Account",
    "nav.group.contact": "Contact",
    "header.store": "Store",
    "header.account": "Account",
    "header.theme": "Theme",
    "header.lang": "Language",
    "welcome.newTitle": "Welcome, {name}",
    "welcome.newBody":
      "Welcome to Muqatshop. Start your journey and discover a different shopping experience.",
    "welcome.returnTitle": "Welcome back, {name}",
    "welcome.returnBody":
      "Glad to see you again. Everything is ready to continue shopping.",
    "overview.statsAll": "All orders",
    "overview.statsActive": "In progress",
    "overview.statsDelivered": "Delivered",
    "overview.latest": "Latest order",
    "overview.allOrders": "All orders",
    "overview.empty": "No orders yet",
    "overview.emptyHint":
      "Orders linked to your account appear here after checkout while signed in.",
    "support.float": "Support",
    "backTop": "Top",
    "loading": "Loading...",
    "orders.title": "My orders",
    "orders.subtitle": "Track and manage every order",
    "orders.search": "Search by order number",
    "orders.all": "All",
    "orders.empty": "No orders",
    "orders.loginRequired": "Sign in to view your orders",
    "addresses.title": "Addresses",
    "addresses.subtitle": "Save delivery addresses for later",
    "addresses.linkFailed": "Could not link customer account",
    "addresses.required": "Complete name, phone, governorate, and center",
    "addresses.updated": "Address updated",
    "addresses.added": "Address added",
    "addresses.deleteConfirm": "Delete this address?",
    "addresses.default": "Default",
    "addresses.setDefault": "Set default",
    "addresses.edit": "Edit",
    "addresses.delete": "Delete",
    "addresses.empty": "No saved addresses yet",
    "addresses.editTitle": "Edit address",
    "addresses.addTitle": "Add address",
    "addresses.label": "Label (home / work)",
    "addresses.fullName": "Full name *",
    "addresses.phone": "Phone *",
    "addresses.phoneAlt": "Alternate phone",
    "addresses.governorate": "Governorate *",
    "addresses.center": "Center *",
    "addresses.centerFirst": "Select governorate first",
    "addresses.area": "Area",
    "addresses.street": "Street",
    "addresses.apartment": "Apartment / building",
    "addresses.asDefault": "Set as default address",
    "addresses.saveEdit": "Save changes",
    "addresses.add": "Add address",
    "addresses.cancel": "Cancel",
    "addresses.unnamed": "Address",
    "profile.title": "Profile",
    "profile.subtitle": "Update the name and phone on your account",
    "profile.name": "Name",
    "profile.phone": "Phone",
    "profile.save": "Save",
    "profile.saving": "Saving...",
    "profile.saved": "Profile saved",
    "wishlist.title": "Wishlist",
    "wishlist.empty": "No saved products",
    "notifications.title": "Notifications",
    "notifications.empty": "No notifications",
    "notifications.refresh": "Refresh",
    "notifications.markRead": "Mark as read",
    "notifications.view": "View",
    "support.title": "Support",
    "support.subtitle": "Chat with Muqatshop support on WhatsApp",
    "support.topic": "Topic",
    "support.orderOptional": "Order number (optional)",
    "settings.title": "Account settings",
    "settings.subtitle": "Security, access, and session",
    "settings.account": "Account",
    "settings.email": "Email",
    "settings.type": "Account type",
    "settings.session": "Session",
    "settings.logout": "Sign out",
    "common.retry": "Retry",
    "common.shop": "Shop now",
    "common.cancel": "Cancel",
  },
};

function formatMsg(template: string, vars?: Record<string, string>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("ar");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AppLocale | null;
      if (saved === "ar" || saved === "en") setLocaleState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  const setLocale = useCallback((l: AppLocale) => setLocaleState(l), []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>) =>
      formatMsg(MESSAGES[locale][key] ?? MESSAGES.ar[key] ?? key, vars),
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      dir: (locale === "ar" ? "rtl" : "ltr") as "rtl" | "ltr",
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale outside LocaleProvider");
  return ctx;
}
