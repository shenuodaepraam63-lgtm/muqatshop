"use client";

type Props = {
  /** When true: force prepaid + WhatsApp confirmation (earbuds). */
  requiresPrepaid?: boolean;
};

/**
 * COD by default. Earbuds / prepaid cart → prepaid WhatsApp flow only.
 */
export function PaymentMethodSelector({ requiresPrepaid = false }: Props) {
  if (requiresPrepaid) {
    return (
      <section className="rounded-[14px] border border-[#E5EAF1] bg-white p-4 sm:p-5">
        <h2 className="mb-1 text-lg font-bold text-[#14243A]">طريقة الدفع</h2>
        <p className="mb-4 text-xs text-[#667085]">
          سلة تحتوي على سماعات إيربودز — الدفع مقدّم إلزامي
        </p>

        <div className="rounded-xl border border-[#168B7D] bg-[#EFF8F6] p-4 ring-1 ring-[#168B7D]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#14243A]">
                دفع مقدّم + تأكيد عبر واتساب
              </p>
              <p className="mt-1 text-xs leading-5 text-[#526174]">
                لسماعات الإيربودز لا يتوفر الدفع عند الاستلام. بعد إرسال الطلب
                تواصل معنا على واتساب لتأكيد الطلب واستلام بيانات الدفع، ثم يتم
                الشحن بعد التحويل.
              </p>
            </div>
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-[#168B7D] bg-[#168B7D]">
              <span className="h-2 w-2 rounded-full bg-white" />
            </span>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-5 text-[#667085]">
          باقي المنتجات في السلة (إن وُجدت) تُعامل بنفس شرط الدفع المقدّم لأن
          السلة تتضمن إيربودز.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[14px] border border-[#E5EAF1] bg-white p-4 sm:p-5">
      <h2 className="mb-1 text-lg font-bold text-[#14243A]">طريقة الدفع</h2>
      <p className="mb-4 text-xs text-[#667085]">
        الطرق المفعّلة حاليًا في المتجر
      </p>

      <div className="rounded-xl border border-[#3157D5] bg-[#EEF2FF] p-4 ring-1 ring-[#3157D5]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#14243A]">الدفع عند الاستلام</p>
            <p className="mt-1 text-xs leading-5 text-[#526174]">
              ادفع نقدًا لمندوب التوصيل عند استلام طلبك. لا رسوم إضافية حاليًا.
            </p>
          </div>
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-[#3157D5] bg-[#3157D5]">
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
        </div>
      </div>
    </section>
  );
}
