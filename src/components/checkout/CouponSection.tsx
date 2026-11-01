"use client";

type Props = {
  code: string;
  appliedCode: string | null;
  message: string;
  disabled?: boolean;
  onCodeChange: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
};

export function CouponSection({
  code,
  appliedCode,
  message,
  disabled,
  onCodeChange,
  onApply,
  onClear,
}: Props) {
  if (disabled) return null;

  return (
    <section className="rounded-[14px] border border-dashed border-[#E5EAF1] bg-white p-4 sm:p-5">
      <h2 className="mb-3 text-sm font-bold text-[#14243A]">
        لديك كوبون خصم؟
      </h2>
      <div className="flex gap-2">
        <input
          className="w-full rounded-xl border border-[#E5EAF1] bg-white px-3 py-2.5 text-sm uppercase outline-none focus:border-[#3157D5] disabled:bg-[#F6F8FB]"
          value={code}
          onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
          placeholder="أدخل كود الخصم"
          disabled={!!appliedCode}
        />
        {appliedCode ? (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-xl border border-[#E5EAF1] px-4 text-sm font-semibold text-[#526174] hover:bg-[#F6F8FB]"
          >
            إلغاء
          </button>
        ) : (
          <button
            type="button"
            onClick={onApply}
            className="shrink-0 rounded-xl bg-[#14243A] px-4 text-sm font-semibold text-white hover:bg-[#1a2f4a]"
          >
            تطبيق
          </button>
        )}
      </div>
      {message && (
        <p
          className={`mt-2 text-xs ${
            appliedCode ? "text-[#16A36A]" : "text-[#667085]"
          }`}
        >
          {message}
        </p>
      )}
    </section>
  );
}
