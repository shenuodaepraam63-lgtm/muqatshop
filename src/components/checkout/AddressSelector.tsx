"use client";

import { useMemo } from "react";
import {
  EGYPT_GOVERNORATES,
  GOVERNORATE_NAMES,
} from "@/lib/egypt-locations";
import type { CustomerAddress } from "@/lib/customer-account";

export type AddressFormState = {
  governorate: string;
  center: string;
  area: string;
  street: string;
  apartment: string;
  notes: string;
};

type Props = {
  addresses: CustomerAddress[];
  selectedAddressId: string | null;
  form: AddressFormState;
  loadingAddresses?: boolean;
  onSelectSaved: (addr: CustomerAddress | null) => void;
  onFormChange: (field: keyof AddressFormState, value: string) => void;
};

const field =
  "w-full rounded-xl border border-[#E5EAF1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#3157D5]";

export function AddressSelector({
  addresses,
  selectedAddressId,
  form,
  loadingAddresses,
  onSelectSaved,
  onFormChange,
}: Props) {
  const centers = useMemo(
    () => (form.governorate ? EGYPT_GOVERNORATES[form.governorate] || [] : []),
    [form.governorate]
  );

  const usingSaved = Boolean(selectedAddressId);

  return (
    <section className="rounded-[14px] border border-[#E5EAF1] bg-white p-4 sm:p-5">
      <h2 className="mb-1 text-lg font-bold text-[#14243A]">عنوان الاستلام</h2>
      <p className="mb-4 text-xs text-[#667085]">
        اختر عنوانًا محفوظًا أو أدخل عنوانًا جديدًا
      </p>

      {loadingAddresses && (
        <p className="mb-3 text-xs text-[#667085]">جاري تحميل العناوين...</p>
      )}

      {addresses.length > 0 && (
        <div className="mb-4 space-y-2">
          {addresses.map((addr) => {
            const selected = selectedAddressId === addr.id;
            return (
              <button
                key={addr.id}
                type="button"
                onClick={() => onSelectSaved(selected ? null : addr)}
                className={`w-full rounded-xl border p-3 text-right transition ${
                  selected
                    ? "border-[#3157D5] bg-[#EEF2FF] ring-1 ring-[#3157D5]"
                    : "border-[#E5EAF1] bg-white hover:border-[#3157D5]/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#14243A]">
                      {addr.label || "عنوان"}
                      {addr.is_default && (
                        <span className="mr-2 text-[11px] font-medium text-[#3157D5]">
                          (افتراضي)
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#526174]">
                      {addr.full_name} · {addr.phone}
                      <br />
                      {addr.governorate} — {addr.center}
                      {addr.area ? ` — ${addr.area}` : ""}
                      {addr.street ? ` · ${addr.street}` : ""}
                    </p>
                  </div>
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                      selected
                        ? "border-[#3157D5] bg-[#3157D5]"
                        : "border-[#D0D5DD]"
                    }`}
                  >
                    {selected && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </span>
                </div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onSelectSaved(null)}
            className={`w-full rounded-xl border border-dashed p-3 text-sm font-semibold transition ${
              !usingSaved
                ? "border-[#3157D5] bg-[#EEF2FF] text-[#3157D5]"
                : "border-[#E5EAF1] text-[#526174] hover:border-[#3157D5]"
            }`}
          >
            + إدخال عنوان جديد
          </button>
        </div>
      )}

      {/* Manual / new address form — always visible when no selection or no saved */}
      {(!usingSaved || addresses.length === 0) && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#14243A]">
                المحافظة *
              </label>
              <select
                className={field}
                value={form.governorate}
                onChange={(e) => {
                  onFormChange("governorate", e.target.value);
                  onFormChange("center", "");
                }}
                required
              >
                <option value="">اختر المحافظة</option>
                {GOVERNORATE_NAMES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#14243A]">
                المركز / القسم *
              </label>
              <select
                className={field}
                value={form.center}
                onChange={(e) => onFormChange("center", e.target.value)}
                required
                disabled={!form.governorate}
              >
                <option value="">
                  {form.governorate ? "اختر المركز" : "اختر المحافظة أولاً"}
                </option>
                {centers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#14243A]">
              المنطقة / القرية
            </label>
            <input
              className={field}
              value={form.area}
              onChange={(e) => onFormChange("area", e.target.value)}
              placeholder="مثال: الحي السابع"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#14243A]">
                الشارع
              </label>
              <input
                className={field}
                value={form.street}
                onChange={(e) => onFormChange("street", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#14243A]">
                رقم العقار / الشقة
              </label>
              <input
                className={field}
                value={form.apartment}
                onChange={(e) => onFormChange("apartment", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#14243A]">
              ملاحظات على العنوان / الطلب
            </label>
            <textarea
              className={`${field} min-h-[72px] resize-y`}
              value={form.notes}
              onChange={(e) => onFormChange("notes", e.target.value)}
              placeholder="علامة مميزة، تعليمات للمندوب..."
            />
          </div>
        </div>
      )}

      {usingSaved && (
        <p className="mt-2 text-xs text-[#16A36A]">
          تم اختيار عنوان محفوظ — يمكنك تغييره أو إدخال عنوان جديد أعلاه.
        </p>
      )}
    </section>
  );
}
