"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { loadAccountIdentity } from "@/lib/account-identity";
import { resolveCustomerId, type CustomerAddress } from "@/lib/customer-account";
import { EGYPT_GOVERNORATES, GOVERNORATE_NAMES } from "@/lib/egypt-locations";
import { useLocale } from "@/lib/locale";
import { supabase } from "@/lib/supabase";

const emptyForm = {
  label: "المنزل",
  full_name: "",
  phone: "",
  phone_alt: "",
  governorate: "",
  center: "",
  area: "",
  street: "",
  apartment: "",
  is_default: false,
};

export default function AccountAddressesPage() {
  const { t } = useLocale();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [rows, setRows] = useState<CustomerAddress[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const centers = useMemo(
    () => (form.governorate ? EGYPT_GOVERNORATES[form.governorate] || [] : []),
    [form.governorate]
  );

  const load = async (cid: string) => {
    const { data, error } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", cid)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) setErr(error.message);
    setRows((data as CustomerAddress[]) || []);
  };

  useEffect(() => {
    (async () => {
      const idRes = await loadAccountIdentity();
      if (!idRes.ok) return;
      const cid = await resolveCustomerId(idRes.identity);
      setCustomerId(cid);
      if (cid) {
        setForm((f) => ({
          ...f,
          full_name: idRes.identity.fullName || "",
          phone: idRes.identity.phone || "",
        }));
        await load(cid);
      } else setErr("تعذر ربط حساب العميل");
      setLoading(false);
    })();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm((f) => ({ ...emptyForm, full_name: f.full_name, phone: f.phone }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!customerId) return;
    if (!form.full_name.trim() || !form.phone.trim() || !form.governorate || !form.center) {
      setErr("أكمل الاسم والهاتف والمحافظة والمركز");
      return;
    }
    setSaving(true);
    const payload = {
      customer_id: customerId,
      label: form.label.trim() || null,
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      phone_alt: form.phone_alt.trim() || null,
      governorate: form.governorate,
      center: form.center,
      area: form.area.trim() || null,
      street: form.street.trim() || null,
      apartment: form.apartment.trim() || null,
      is_default: form.is_default,
      updated_at: new Date().toISOString(),
    };

    if (form.is_default) {
      await supabase
        .from("customer_addresses")
        .update({ is_default: false })
        .eq("customer_id", customerId);
    }

    let error;
    if (editingId) {
      ({ error } = await supabase
        .from("customer_addresses")
        .update(payload)
        .eq("id", editingId));
    } else {
      ({ error } = await supabase.from("customer_addresses").insert(payload));
    }
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg(editingId ? "تم تحديث العنوان" : "تم إضافة العنوان");
    resetForm();
    await load(customerId);
  };

  const startEdit = (row: CustomerAddress) => {
    setEditingId(row.id);
    setForm({
      label: row.label || "",
      full_name: row.full_name,
      phone: row.phone,
      phone_alt: row.phone_alt || "",
      governorate: row.governorate,
      center: row.center,
      area: row.area || "",
      street: row.street || "",
      apartment: row.apartment || "",
      is_default: row.is_default,
    });
  };

  const remove = async (id: string) => {
    if (!customerId || !confirm("حذف هذا العنوان؟")) return;
    const { error } = await supabase.from("customer_addresses").delete().eq("id", id);
    if (error) setErr(error.message);
    else await load(customerId);
  };

  const setDefault = async (id: string) => {
    if (!customerId) return;
    await supabase
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("customer_id", customerId);
    await supabase.from("customer_addresses").update({ is_default: true }).eq("id", id);
    await load(customerId);
  };

  const field =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2.5 text-sm text-[var(--text)]";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[var(--text)]">{t("addresses.title")}</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t("addresses.subtitle")}</p>
      </div>

      {loading && <p className="text-sm text-[var(--text-muted)]">{t("loading")}</p>}
      {err && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-[#D64C4C] dark:bg-red-950/40">
          {err}
        </p>
      )}
      {msg && (
        <p className="rounded-xl bg-[#EFF8F6] px-3 py-2 text-sm text-[#21865B] dark:bg-[#0f2a26]">
          {msg}
        </p>
      )}

      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="account-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-[var(--text)]">
                  {row.label || "عنوان"}{" "}
                  {row.is_default && (
                    <span className="text-xs text-[#3157D5]">(افتراضي)</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {row.full_name} · {row.phone}
                  <br />
                  {row.governorate} — {row.center}
                  {row.area ? ` — ${row.area}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!row.is_default && (
                  <button
                    type="button"
                    onClick={() => setDefault(row.id)}
                    className="text-xs font-semibold text-[#3157D5]"
                  >
                    تعيين افتراضي
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startEdit(row)}
                  className="text-xs font-semibold text-[var(--text)]"
                >
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  className="text-xs font-semibold text-[#D64C4C]"
                >
                  حذف
                </button>
              </div>
            </div>
          </li>
        ))}
        {!loading && !rows.length && (
          <li className="account-card border-dashed px-4 py-8 text-center text-sm text-[var(--text-muted)]">
            لا توجد عناوين محفوظة بعد
          </li>
        )}
      </ul>

      <form onSubmit={onSubmit} className="account-card space-y-3 p-5">
        <h3 className="text-sm font-bold text-[var(--text)]">
          {editingId ? "تعديل عنوان" : "إضافة عنوان"}
        </h3>
        <input
          className={field}
          placeholder="تسمية (المنزل / العمل)"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
        />
        <input
          className={field}
          placeholder="الاسم الكامل *"
          required
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={field}
            placeholder="الهاتف *"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className={field}
            placeholder="هاتف احتياطي"
            value={form.phone_alt}
            onChange={(e) => setForm({ ...form, phone_alt: e.target.value })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className={field}
            required
            value={form.governorate}
            onChange={(e) =>
              setForm({ ...form, governorate: e.target.value, center: "" })
            }
          >
            <option value="">المحافظة *</option>
            {GOVERNORATE_NAMES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            className={field}
            required
            value={form.center}
            onChange={(e) => setForm({ ...form, center: e.target.value })}
            disabled={!form.governorate}
          >
            <option value="">
              {form.governorate ? "المركز *" : "اختر المحافظة أولاً"}
            </option>
            {centers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <input
          className={field}
          placeholder="المنطقة"
          value={form.area}
          onChange={(e) => setForm({ ...form, area: e.target.value })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={field}
            placeholder="الشارع"
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
          />
          <input
            className={field}
            placeholder="الشقة / المبنى"
            value={form.apartment}
            onChange={(e) => setForm({ ...form, apartment: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
          />
          تعيين كعنوان افتراضي
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#14243A] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-[#3157D5]"
          >
            {saving ? "..." : editingId ? "حفظ التعديل" : "إضافة العنوان"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text-muted)]"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
