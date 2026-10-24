"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2 } from "lucide-react";

type CouponRow = {
  id: string;
  code: string;
  discount_type: string;
  value: number;
  min_order: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
};

export default function AdminCouponsPage() {
  const [list, setList] = useState<CouponRow[]>([]);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [minOrder, setMinOrder] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expires, setExpires] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    setList((data as CouponRow[]) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const payload = {
      code: code.trim().toUpperCase(),
      discount_type: type,
      value: Number(value),
      min_order: minOrder ? Number(minOrder) : 0,
      max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expires ? new Date(expires).toISOString() : null,
      is_active: true,
    };
    const { error } = await supabase.from("coupons").insert(payload);
    if (error) {
      setMsg(error.message);
      return;
    }
    setCode("");
    setValue("10");
    setMinOrder("");
    setMaxUses("");
    setExpires("");
    setMsg("تم إضافة الكوبون");
    load();
  };

  const toggle = async (id: string, is_active: boolean) => {
    await supabase.from("coupons").update({ is_active: !is_active }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف الكوبون؟")) return;
    await supabase.from("coupons").delete().eq("id", id);
    load();
  };

  const field = "border border-[#e8e2d9] rounded-xl px-3 py-2 text-sm w-full";

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">كوبونات الخصم</h1>
        <p className="text-sm text-muted mt-1">نسبة مئوية أو مبلغ ثابت</p>
      </div>

      <form onSubmit={add} className="bg-white border border-[#e8e2d9] rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> كوبون جديد
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={field} value={code} onChange={(e) => setCode(e.target.value)} placeholder="الكود (SALE10)" required />
          <select className={field} value={type} onChange={(e) => setType(e.target.value as "percent" | "fixed")}>
            <option value="percent">نسبة %</option>
            <option value="fixed">مبلغ ثابت ج.م</option>
          </select>
          <input className={field} type="number" min="1" value={value} onChange={(e) => setValue(e.target.value)} placeholder="القيمة" required />
          <input className={field} type="number" min="0" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="حد أدنى للطلب (اختياري)" />
          <input className={field} type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="أقصى استخدامات (اختياري)" />
          <input className={field} type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} />
        </div>
        <button type="submit" className="bg-ink text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
          حفظ الكوبون
        </button>
        {msg && <p className="text-sm text-muted">{msg}</p>}
      </form>

      <div className="bg-white border border-[#e8e2d9] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f8f5f0] text-muted text-right">
            <tr>
              <th className="p-3 font-medium">الكود</th>
              <th className="p-3 font-medium">الخصم</th>
              <th className="p-3 font-medium">استخدام</th>
              <th className="p-3 font-medium">حالة</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-t border-[#e8e2d9]">
                <td className="p-3 font-mono font-semibold">{c.code}</td>
                <td className="p-3">
                  {c.discount_type === "percent" ? `${c.value}%` : `${c.value} ج.م`}
                </td>
                <td className="p-3">
                  {c.used_count}
                  {c.max_uses != null ? ` / ${c.max_uses}` : ""}
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => toggle(c.id, c.is_active)}
                    className={c.is_active ? "text-green-700" : "text-muted"}
                  >
                    {c.is_active ? "نشط" : "موقوف"}
                  </button>
                </td>
                <td className="p-3">
                  <button type="button" onClick={() => remove(c.id)} className="text-sale">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted">
                  لا توجد كوبونات بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
