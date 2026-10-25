"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function MarketerCalculatorPage() {
  const [base, setBase] = useState("200");
  const [sell, setSell] = useState("280");
  const [ship, setShip] = useState("80");
  const [cpp, setCpp] = useState("40");
  const [orders, setOrders] = useState("30");
  const [success, setSuccess] = useState("70");

  const r = useMemo(() => {
    const b = Number(base) || 0;
    const s = Number(sell) || 0;
    const sh = Number(ship) || 0;
    const c = Number(cpp) || 0;
    const n = Math.max(0, Number(orders) || 0);
    const rate = Math.min(100, Math.max(0, Number(success) || 0)) / 100;

    const profitPer = Math.max(0, s - b);
    const delivered = n * rate;
    const adSpend = n * c;
    const grossProfit = delivered * profitPer;
    const net = grossProfit - adSpend;
    const breakEvenCpp = profitPer > 0 ? profitPer * rate : 0;
    const customerPays = s + sh;

    return {
      profitPer,
      delivered,
      adSpend,
      grossProfit,
      net,
      breakEvenCpp,
      customerPays,
    };
  }, [base, sell, ship, cpp, orders, success]);

  const field =
    "w-full border border-[#eae6df] rounded-xl px-3 py-2.5 text-sm bg-white";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#0042EB]" />
          حاسبة الأرباح
        </h1>
        <p className="text-sm text-muted mt-1">
          اختبر سعر البيع وتكلفة الأوردر (CPP) ونسبة التسليم قبل ما تصرف على
          الإعلانات
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#eae6df] rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">مدخلات المنتج</h2>
          <label className="block text-xs text-muted">السعر الأساسي (تكلفة المنصة)</label>
          <input className={field} type="number" value={base} onChange={(e) => setBase(e.target.value)} />
          <label className="block text-xs text-muted">سعر البيع للعميل</label>
          <input className={field} type="number" value={sell} onChange={(e) => setSell(e.target.value)} />
          <label className="block text-xs text-muted">مصاريف الشحن (على العميل)</label>
          <input className={field} type="number" value={ship} onChange={(e) => setShip(e.target.value)} />
        </div>

        <div className="bg-white border border-[#eae6df] rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">سيناريو الحملة</h2>
          <label className="block text-xs text-muted">تكلفة الأوردر CPP (إعلان)</label>
          <input className={field} type="number" value={cpp} onChange={(e) => setCpp(e.target.value)} />
          <label className="block text-xs text-muted">عدد الأوردرات المتوقعة</label>
          <input className={field} type="number" value={orders} onChange={(e) => setOrders(e.target.value)} />
          <label className="block text-xs text-muted">نسبة نجاح التسليم %</label>
          <input className={field} type="number" min={0} max={100} value={success} onChange={(e) => setSuccess(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="ربح المسوق / قطعة" value={formatPrice(r.profitPer)} />
        <Stat label="يدفع العميل (COD)" value={formatPrice(r.customerPays)} />
        <Stat label="أوردرات متوقعة مسلّمة" value={r.delivered.toFixed(1)} />
        <Stat label="إجمالي صرف الإعلان" value={formatPrice(r.adSpend)} />
        <Stat label="إجمالي ربح التسليم" value={formatPrice(r.grossProfit)} />
        <Stat
          label="صافي بعد الإعلان"
          value={formatPrice(r.net)}
          accent={r.net >= 0 ? "text-green-700" : "text-sale"}
        />
      </div>

      <div className="bg-[#eef2ff] border border-[#c7d2fe] rounded-2xl p-4 text-sm">
        <p className="font-medium">نقطة التعادل التقريبية لـ CPP</p>
        <p className="text-muted text-xs mt-1 leading-relaxed">
          عشان متخسرش مع نسبة التسليم الحالية، خليك تحت حوالي{" "}
          <strong className="text-ink">{formatPrice(r.breakEvenCpp)}</strong> كتكلفة
          أوردر إعلانية. أي CPP أعلى من كده مع نفس نسبة التسليم بيأكل من صافي
          ربحك.
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = "text-ink",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-white border border-[#eae6df] rounded-2xl p-4">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={`text-lg font-bold mt-1 ${accent}`}>{value}</p>
    </div>
  );
}
