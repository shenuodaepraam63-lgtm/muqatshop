"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Package,
  Images,
  Banknote,
  TrendingUp,
  Clock,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";
import { supabase, productMainImage } from "@/lib/supabase";
import {
  getMerchantSession,
  releaseMaturedProfits,
  makeMerchantCode,
} from "@/lib/merchant";
import { formatPrice } from "@/lib/utils";

type RecentOrder = {
  id: string;
  order_number: string | null;
  customer_name: string;
  total: number;
  status: string;
  merchant_profit: number | null;
  created_at: string;
};

type CatProd = {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
};

const STATUS_AR: Record<string, string> = {
  new: "جديد",
  confirmed: "مؤكد",
  shipped: "قيد التوصيل",
  delivered: "مسلّم",
  cancelled: "ملغي",
};

export default function MarketerOverviewPage() {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState(0);
  const [realized, setRealized] = useState(0);
  const [salesVolume, setSalesVolume] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [inProgress, setInProgress] = useState(0);
  const [delivered, setDelivered] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [catalog, setCatalog] = useState<CatProd[]>([]);

  useEffect(() => {
    const s = getMerchantSession();
    if (!s) return;
    setName(s.name);
    (async () => {
      await releaseMaturedProfits(s.id);

      const [{ data: w }, { data: ords }, { data: prods }] = await Promise.all([
        supabase
          .from("merchant_wallets")
          .select("balance, pending")
          .eq("merchant_id", s.id)
          .maybeSingle(),
        supabase
          .from("orders")
          .select(
            "id, order_number, customer_name, total, status, merchant_profit, created_at"
          )
          .eq("merchant_id", s.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("products")
          .select("id, name, price, images")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      if (w) {
        setBalance(Number(w.balance) || 0);
        setPending(Number(w.pending) || 0);
      }

      const list = (ords || []) as RecentOrder[];
      setTotalOrders(list.length);
      const del = list.filter((o) => o.status === "delivered");
      const prog = list.filter((o) =>
        ["new", "confirmed", "shipped"].includes(o.status)
      );
      const cancel = list.filter((o) => o.status === "cancelled").length;
      setDelivered(del.length);
      setInProgress(prog.length);
      setSalesVolume(
        list
          .filter((o) => o.status !== "cancelled")
          .reduce((s, o) => s + (Number(o.total) || 0), 0)
      );
      setRealized(
        del.reduce((s, o) => s + (Number(o.merchant_profit) || 0), 0)
      );
      const closed = del.length + cancel;
      setSuccessRate(closed > 0 ? Math.round((del.length / closed) * 100) : 0);
      setRecent(list.slice(0, 5));
      setCatalog((prods as CatProd[]) || []);
    })();
  }, []);

  const cards = [
    {
      label: "الرصيد المتاح للسحب",
      value: formatPrice(balance),
      hint: "معتمد وقابل للتحويل",
      icon: Banknote,
      accent: "text-green-700",
    },
    {
      label: "الأرباح المعلقة",
      value: formatPrice(pending),
      hint: "قيد التجهيز والشحن والتسليم",
      icon: Clock,
      accent: "text-amber-700",
    },
    {
      label: "الأرباح المحققة (المؤهلة)",
      value: formatPrice(realized),
      hint: "تم تسليمها للعميل وتوريد النقدية",
      icon: CheckCircle2,
      accent: "text-[#0042EB]",
    },
    {
      label: "إجمالي حجم المبيعات",
      value: formatPrice(salesVolume),
      hint: "قيمة مبيعات عملائك بالمنصة",
      icon: TrendingUp,
      accent: "text-ink",
    },
    {
      label: "إجمالي الأوردرات",
      value: String(totalOrders),
      hint: "المسجلة في حسابك",
      icon: ShoppingBag,
      accent: "text-ink",
    },
    {
      label: "الأوردرات قيد التنفيذ",
      value: String(inProgress),
      hint: "معتمدة وقيد التجهيز أو الشحن",
      icon: Package,
      accent: "text-ink",
    },
    {
      label: "الأوردرات المسلّمة",
      value: String(delivered),
      hint: "تم تسليمها وتحصيل قيمتها",
      icon: CheckCircle2,
      accent: "text-green-700",
    },
    {
      label: "نسبة نجاح التسليم",
      value: `${successRate}%`,
      hint: "معدل التنفيذ الفعلي",
      icon: TrendingUp,
      accent: "text-ink",
    },
  ];

  const quick = [
    {
      href: "/merchant/new-order",
      title: "تسجيل أوردر جديد",
      desc: "إدخال بيانات عميل",
      icon: PlusCircle,
    },
    {
      href: "/merchant/catalog",
      title: "كتالوج المنتجات",
      desc: "تصفح المنتجات المعتمدة",
      icon: Package,
    },
    {
      href: "/merchant/media",
      title: "الوسائط الإعلانية",
      desc: "صور وفيديوهات وكابشن",
      icon: Images,
    },
    {
      href: "/merchant/withdrawals",
      title: "سحب الأرباح",
      desc: "فودافون كاش وإنستاباي",
      icon: Banknote,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-ink">
          مساحة عمل المسوق — {name || "..."}
        </h1>
        <p className="text-sm text-muted mt-1">
          متابعة مبيعاتك وأرباحك الحقيقية، طلبات العملاء المسجلة، ورصيدك المعتمد
          للسحب
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="bg-white border border-[#eae6df] rounded-2xl p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] text-muted leading-snug">{c.label}</p>
                <Icon className={`w-4 h-4 shrink-0 ${c.accent}`} strokeWidth={1.75} />
              </div>
              <p className={`text-lg md:text-xl font-bold ${c.accent}`}>{c.value}</p>
              <p className="text-[10px] text-muted">{c.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quick.map((q) => {
          const Icon = q.icon;
          return (
            <Link
              key={q.href}
              href={q.href}
              className="bg-white border border-[#eae6df] rounded-2xl p-4 hover:border-ink/30 hover:shadow-sm transition"
            >
              <Icon className="w-5 h-5 text-[#0042EB] mb-2" strokeWidth={1.75} />
              <p className="font-semibold text-sm text-ink">{q.title}</p>
              <p className="text-[11px] text-muted mt-0.5">{q.desc}</p>
            </Link>
          );
        })}
      </div>

      <section className="bg-white border border-[#eae6df] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0ebe3]">
          <h2 className="font-semibold text-sm">آخر طلباتك المسجلة</h2>
          <Link href="/merchant/orders" className="text-xs text-[#0042EB] hover:underline">
            عرض جميع الطلبات ({totalOrders})
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted text-center py-10">
            لا توجد طلبات مسجلة بعد في حسابك.
          </p>
        ) : (
          <ul className="divide-y divide-[#f0ebe3]">
            {recent.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/merchant/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#faf9f6] text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{o.customer_name}</p>
                    <p className="text-[11px] text-muted">
                      {o.order_number || o.id.slice(0, 8)} ·{" "}
                      {STATUS_AR[o.status] || o.status}
                    </p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-semibold">{formatPrice(Number(o.total))}</p>
                    {Number(o.merchant_profit) > 0 && (
                      <p className="text-[11px] text-green-700">
                        +{formatPrice(Number(o.merchant_profit))}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">منتجات معتمدة في الكتالوج</h2>
          <Link href="/merchant/catalog" className="text-xs text-[#0042EB] hover:underline">
            الكتالوج
          </Link>
        </div>
        {catalog.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">لا منتجات بعد</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {catalog.map((p) => {
              const base = Number(p.price) || 0;
              const suggest = Math.round(base * 1.08);
              const img = productMainImage(p as never) || "";
              return (
                <Link
                  key={p.id}
                  href="/merchant/catalog"
                  className="bg-white border border-[#eae6df] rounded-2xl p-3 hover:shadow-sm transition"
                >
                  <div className="aspect-square rounded-xl bg-[#f5f1e8] mb-2 overflow-hidden">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <p className="text-sm font-medium line-clamp-2">{p.name}</p>
                  <p className="text-[11px] text-muted mt-1">
                    السعر الأساسي: {formatPrice(base)}
                  </p>
                  <p className="text-[11px] text-green-700">
                    ربح متوقع (مثال): +{formatPrice(suggest - base)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
