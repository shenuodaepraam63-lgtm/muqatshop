"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Menu, Minus, Plus, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useCartStore } from "@/lib/store";
import type { Category } from "@/lib/supabase";

type Dialog = "search" | "cart" | null;

export function HomeHeader({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const itemCount = useCartStore((state) => state.totalItems());
  const [dialog, setDialog] = useState<Dialog>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = dialogRef.current;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDialog(null);
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const focusable = Array.from(root.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
      ));
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !root.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !root.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    const initial = root?.querySelector<HTMLElement>("[autofocus]") || root?.querySelector<HTMLElement>("a[href],button:not([disabled]),input:not([disabled])");
    initial?.focus();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [dialog]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = search.trim();
    setDialog(null);
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  };

  const closeMenus = () => {
    setMobileOpen(false);
    setCategoryOpen(false);
  };

  return (
    <>
      <header className={`sticky top-0 z-40 border-b border-[#E4E9F0] bg-white/95 backdrop-blur transition-shadow ${scrolled ? "shadow-[0_6px_24px_rgba(20,36,58,.08)]" : ""}`}>
        <div className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setMobileOpen((value) => !value)} className="rounded-lg p-2 text-[#14243A] hover:bg-[#F6F8FB] md:hidden" aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={mobileOpen}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" aria-label="Muqatshop — الرئيسية" onClick={closeMenus} className="flex shrink-0 items-center">
              <BrandLogo size="sm" tone="navy" className="max-h-14" />
            </Link>
          </div>

          <nav className="hidden items-center gap-5 text-sm font-semibold text-[#202B3C] lg:flex" aria-label="القائمة الرئيسية">
            <Link href="/" className="text-[#3157D5]">الرئيسية</Link>
            <Link href="/shop" className="transition hover:text-[#3157D5]">المنتجات</Link>
            <div className="relative">
              <button type="button" onClick={() => setCategoryOpen((value) => !value)} aria-expanded={categoryOpen} aria-haspopup="true" className="inline-flex items-center gap-1 transition hover:text-[#3157D5]">
                التصنيفات <ChevronDown className={`h-4 w-4 transition ${categoryOpen ? "rotate-180" : ""}`} />
              </button>
              {categoryOpen && <div className="absolute right-0 top-full mt-3 grid min-w-56 gap-1 rounded-xl border border-[#E4E9F0] bg-white p-2 shadow-xl" role="menu">
                {categories.slice(0, 8).map((category) => <Link key={category.id} href={`/categories/${encodeURIComponent(category.slug)}`} role="menuitem" onClick={closeMenus} className="rounded-lg px-3 py-2 text-sm hover:bg-[#F6F8FB]">{category.name}</Link>)}
                <Link href="/categories" role="menuitem" onClick={closeMenus} className="rounded-lg px-3 py-2 text-sm font-bold text-[#3157D5] hover:bg-[#F6F8FB]">جميع التصنيفات</Link>
              </div>}
            </div>
            <a href="mailto:muqatshop@gmail.com?subject=%D8%AA%D8%B9%D8%A7%D9%88%D9%86%20%D8%AA%D8%AC%D8%A7%D8%B1%D9%8A" className="transition hover:text-[#3157D5]">انضم كتاجر</a>
            <Link href="/merchant/register" className="transition hover:text-[#3157D5]">انضم كمسوق</Link>
            <Link href="/#why-muqatshop" className="transition hover:text-[#3157D5]">عن المنصة</Link>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button type="button" onClick={() => setDialog("search")} aria-label="بحث" className="rounded-lg p-2 text-[#14243A] transition hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3157D5]"><Search className="h-5 w-5" /></button>
            <button type="button" onClick={() => setDialog("cart")} aria-label={`السلة، ${itemCount} منتجات`} className="relative rounded-lg p-2 text-[#14243A] transition hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3157D5]">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#3157D5] px-1 text-center text-[10px] font-bold leading-5 text-white">{itemCount}</span>}
            </button>
            <Link href="/welcome?tab=customer" className="hidden min-h-10 items-center gap-2 rounded-lg border border-[#D6DDEA] px-3 text-sm font-semibold text-[#14243A] transition hover:bg-[#F6F8FB] sm:inline-flex"><UserRound className="h-4 w-4" /><span>تسجيل الدخول</span></Link>
            <Link href="/welcome?tab=customer&mode=register" className="hidden min-h-10 items-center rounded-lg bg-[#3157D5] px-3 text-sm font-semibold text-white transition hover:bg-[#2447B8] sm:inline-flex">إنشاء حساب</Link>
          </div>
        </div>
        {mobileOpen && <div className="border-t border-[#E4E9F0] bg-white px-4 pb-5 pt-3 md:hidden">
          <nav className="mx-auto flex max-w-[1280px] flex-col gap-1" aria-label="قائمة الهاتف">
            <Link onClick={closeMenus} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[#F6F8FB]" href="/">الرئيسية</Link>
            <Link onClick={closeMenus} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[#F6F8FB]" href="/shop">المنتجات</Link>
            <button type="button" onClick={() => setCategoryOpen((value) => !value)} aria-expanded={categoryOpen} className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[#F6F8FB]">التصنيفات <ChevronDown className="h-4 w-4" /></button>
            {categoryOpen && <div className="mr-3 border-r border-[#E4E9F0] pr-2">{categories.slice(0, 8).map((category) => <Link key={category.id} href={`/categories/${encodeURIComponent(category.slug)}`} onClick={closeMenus} className="block rounded-lg px-3 py-2.5 text-sm text-[#526174] hover:bg-[#F6F8FB]">{category.name}</Link>)}<Link href="/categories" onClick={closeMenus} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-[#3157D5]">كل التصنيفات</Link></div>}
            <a onClick={closeMenus} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[#F6F8FB]" href="mailto:muqatshop@gmail.com?subject=%D8%AA%D8%B9%D8%A7%D9%88%D9%86%20%D8%AA%D8%AC%D8%A7%D8%B1%D9%8A">انضم كتاجر</a>
            <Link onClick={closeMenus} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[#F6F8FB]" href="/merchant/register">انضم كمسوق</Link>
            <Link onClick={closeMenus} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[#F6F8FB]" href="/#why-muqatshop">عن المنصة</Link>
            <div className="mt-2 grid grid-cols-2 gap-2"><Link onClick={closeMenus} href="/welcome?tab=customer" className="rounded-lg border border-[#D6DDEA] px-3 py-3 text-center text-sm font-semibold">تسجيل الدخول</Link><Link onClick={closeMenus} href="/welcome?tab=customer&mode=register" className="rounded-lg bg-[#3157D5] px-3 py-3 text-center text-sm font-semibold text-white">إنشاء حساب</Link></div>
          </nav>
        </div>}
      </header>

      {dialog === "search" && <div className="fixed inset-0 z-[80] flex items-start justify-center bg-[#14243A]/55 px-4 pt-[12vh]" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}>
        <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="home-search-title" className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
          <div className="mb-4 flex items-center justify-between"><h2 id="home-search-title" className="text-lg font-bold text-[#14243A]">ابحث عن منتج</h2><button type="button" onClick={() => setDialog(null)} aria-label="إغلاق البحث" className="rounded-lg p-2 hover:bg-[#F6F8FB]"><X className="h-5 w-5" /></button></div>
          <form onSubmit={submitSearch} className="flex gap-2"><label className="sr-only" htmlFor="home-search-input">اسم المنتج أو وصفه</label><input id="home-search-input" autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالاسم أو الوصف أو الماركة..." className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#D6DDEA] px-4 text-sm outline-none focus:border-[#3157D5] focus:ring-2 focus:ring-[#3157D5]/15" /><button className="flex min-h-12 items-center gap-2 rounded-xl bg-[#3157D5] px-4 text-sm font-semibold text-white"><Search className="h-4 w-4" /> بحث</button></form>
          <p className="mt-3 text-xs text-[#718096]">اضغط Escape لإغلاق نافذة البحث.</p>
        </section>
      </div>}

      {dialog === "cart" && <CartDrawer onClose={() => setDialog(null)} dialogRef={dialogRef} />}
    </>
  );
}

function CartDrawer({ onClose, dialogRef }: { onClose: () => void; dialogRef: RefObject<HTMLElement | null> }) {
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.totalPrice());
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  return <div className="fixed inset-0 z-[80] bg-[#14243A]/45" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="home-cart-title" className="absolute inset-y-0 left-0 flex w-full max-w-md flex-col bg-white shadow-2xl" dir="rtl">
      <div className="flex items-center justify-between border-b border-[#E4E9F0] px-5 py-4"><div><h2 id="home-cart-title" className="text-lg font-bold text-[#14243A]">سلة التسوق</h2><p className="text-xs text-[#718096]">{items.reduce((sum, item) => sum + item.quantity, 0)} منتجات</p></div><button type="button" onClick={onClose} aria-label="إغلاق السلة" className="rounded-lg p-2 hover:bg-[#F6F8FB]"><X className="h-5 w-5" /></button></div>
      {items.length === 0 ? <div className="flex flex-1 flex-col items-center justify-center px-6 text-center"><ShoppingBag className="mb-4 h-12 w-12 text-[#718096]" strokeWidth={1.3} /><h3 className="font-semibold text-[#14243A]">سلتك فارغة الآن</h3><p className="mt-1 text-sm text-[#718096]">اكتشف المنتجات وأضف ما يناسبك.</p><Link href="/shop" onClick={onClose} className="mt-5 rounded-lg bg-[#3157D5] px-5 py-3 text-sm font-semibold text-white">تصفح المنتجات</Link></div> : <>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">{items.map((item) => <div key={item.id} className="flex gap-3 border-b border-[#E4E9F0] pb-4"><div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#F6F8FB]">{item.image && <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />}</div><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-semibold text-[#202B3C]">{item.name}</p><p className="mt-1 text-sm font-bold text-[#14243A]">{new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(item.price)}</p><div className="mt-2 flex items-center gap-2"><button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="تقليل الكمية" className="rounded border border-[#D6DDEA] p-1"><Minus className="h-3 w-3" /></button><span className="min-w-5 text-center text-xs">{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="زيادة الكمية" className="rounded border border-[#D6DDEA] p-1"><Plus className="h-3 w-3" /></button><button type="button" onClick={() => removeItem(item.id)} className="mr-auto text-xs font-semibold text-[#D64C4C]">حذف</button></div></div></div>)}</div>
        <div className="border-t border-[#E4E9F0] p-5"><div className="mb-4 flex justify-between text-sm"><span className="text-[#718096]">الإجمالي</span><strong className="text-[#14243A]">{new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(total)}</strong></div><Link href="/cart" onClick={onClose} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#3157D5] px-4 text-sm font-semibold text-white">متابعة إلى السلة <ArrowLeft className="h-4 w-4" /></Link></div>
      </>}
    </aside>
  </div>;
}
