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
  t: (key: string) => string;
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
  },
};

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
    (key: string) => MESSAGES[locale][key] ?? MESSAGES.ar[key] ?? key,
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
