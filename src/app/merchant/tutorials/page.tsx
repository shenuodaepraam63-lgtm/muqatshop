"use client";

import Link from "next/link";
import { BookOpen, ChevronLeft } from "lucide-react";

const ITEMS = [
  {
    title: "كيف تسجّل أوردر جديد؟",
    body: "من «إضافة أوردر» اختر المنتجات، حدّد سعر البيع للعميل (لازم يكون أعلى من السعر الأساسي)، املأ بيانات العميل والمحافظة، ثم أكّد الطلب. المنصة تتولى الشحن والتحصيل COD.",
  },
  {
    title: "إزاي يتحسب ربحي؟",
    body: "ربحك = سعر البيع اللي حددته − السعر الأساسي للمنتج. الشحن بيتحصّل من العميل منفصل حسب المحافظة. الربح بيتعلّق بعد التسليم ثم ينزل للمحفظة بعد فترة الانتظار.",
  },
  {
    title: "متى أقدر أسحب الأرباح؟",
    body: "بعد ما الأوردر يتسلّم ويتحصّل، الربح يدخل «معلّق» ثم يتحوّل لرصيد متاح. من «طلبات السحب» اطلب التحويل على فودافون كاش أو إنستاباي.",
  },
  {
    title: "الكتالوج والوسائط",
    body: "من الكتالوج تقدر تحفظ سعر بيعك وتنسخ رابط/وصف/صور. من الوسائط التسويقية تلاقي كابشنات جاهزة لكل منتج.",
  },
  {
    title: "صفحاتي والمفضلة",
    body: "صفحاتي للتصنيف الداخلي (صفحة فيسبوك، مجموعة واتساب...). المفضلة لحفظ منتجات بترجع لها كتير.",
  },
];

export default function MarketerTutorialsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">شروحات المنصة</h1>
        <p className="text-sm text-muted mt-1">دليل سريع لبوابة المسوق</p>
      </div>

      <div className="space-y-3">
        {ITEMS.map((item) => (
          <details
            key={item.title}
            className="bg-white border border-[#eae6df] rounded-2xl group open:shadow-sm"
          >
            <summary className="cursor-pointer list-none px-4 py-3.5 flex items-center justify-between gap-2 font-medium text-sm">
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0042EB] shrink-0" />
                {item.title}
              </span>
              <ChevronLeft className="w-4 h-4 text-muted transition group-open:-rotate-90" />
            </summary>
            <p className="px-4 pb-4 text-sm text-muted leading-relaxed">{item.body}</p>
          </details>
        ))}
      </div>

      <div className="bg-[#eef2ff] border border-[#c7d2fe] rounded-2xl p-4 text-sm">
        <p className="font-medium text-ink mb-1">محتاج مساعدة؟</p>
        <p className="text-muted text-xs mb-3">
          تواصل مع الدعم من المتجر العام أو راجع حاسبة الأرباح قبل الحملات.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/merchant/calculator"
            className="text-xs bg-ink text-white px-4 py-2 rounded-full"
          >
            حاسبة الأرباح
          </Link>
          <Link
            href="/merchant/new-order"
            className="text-xs border border-ink px-4 py-2 rounded-full"
          >
            جرب أوردر تجريبي
          </Link>
        </div>
      </div>
    </div>
  );
}
