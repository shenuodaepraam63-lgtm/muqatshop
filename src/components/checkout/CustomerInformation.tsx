"use client";

type Props = {
  fullName: string;
  phone: string;
  phoneAlt: string;
  email?: string | null;
  isMerchantOrder?: boolean;
  onChange: (field: "fullName" | "phone" | "phoneAlt", value: string) => void;
};

export function CustomerInformation({
  fullName,
  phone,
  phoneAlt,
  email,
  isMerchantOrder,
  onChange,
}: Props) {
  return (
    <section className="rounded-[14px] border border-[#E5EAF1] bg-white p-4 sm:p-5">
      <h2 className="mb-1 text-lg font-bold text-[#14243A]">بيانات العميل</h2>
      <p className="mb-4 text-xs text-[#667085]">
        {isMerchantOrder
          ? "أدخل بيانات العميل المستلم"
          : email
            ? `الطلب سيُربط بحسابك (${email})`
            : "الحقول المعلّمة * مطلوبة"}
      </p>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#14243A]">
            {isMerchantOrder ? "اسم العميل *" : "الاسم الكامل *"}
          </label>
          <input
            className="input-field w-full rounded-xl border border-[#E5EAF1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#3157D5]"
            value={fullName}
            onChange={(e) => onChange("fullName", e.target.value)}
            placeholder="الاسم بالكامل"
            required
            autoComplete="name"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#14243A]">
              رقم الهاتف *
            </label>
            <input
              className="input-field w-full rounded-xl border border-[#E5EAF1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#3157D5]"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => onChange("phone", e.target.value)}
              placeholder="01xxxxxxxxx"
              required
              autoComplete="tel"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#14243A]">
              هاتف احتياطي
            </label>
            <input
              className="input-field w-full rounded-xl border border-[#E5EAF1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#3157D5]"
              type="tel"
              inputMode="numeric"
              value={phoneAlt}
              onChange={(e) => onChange("phoneAlt", e.target.value)}
              placeholder="اختياري"
              autoComplete="tel"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
