"use client";

export default function VisitorsAnalyticsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[#14243A]">إحصائيات الزائرين</h2>
        <p className="mt-1 text-sm text-[#718096]">
          افهم حركة الزوار وتفاعلهم مع صفحات ومنتجات المتجر.
        </p>
      </div>
      <div className="rounded-2xl border border-dashed border-[#E4E9F0] bg-white px-6 py-16 text-center">
        <p className="text-sm font-semibold text-[#202B3C]">لا توجد بيانات زيارات بعد</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#718096]">
          المشروع لا يحتوي حاليًا على نظام تتبع للزيارات (page views / sessions).
          الصفحة جاهزة هيكليًا وستُربط عند إضافة مصدر بيانات موثوق — بدون أرقام تجريبية.
        </p>
      </div>
    </div>
  );
}
