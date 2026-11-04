"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CustomerRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  account_type: string | null;
  is_active: boolean | null;
  created_at?: string;
};

export default function AdminCustomersPage() {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("profiles")
        .select("id, full_name, phone, account_type, is_active, created_at")
        .eq("account_type", "customer")
        .order("created_at", { ascending: false })
        .limit(100);

      if (err) {
        // fallback customers table
        const { data: c, error: cErr } = await supabase
          .from("customers")
          .select("id, name, phone, email, is_active, created_at")
          .order("created_at", { ascending: false })
          .limit(100);
        if (cErr) {
          setError(cErr.message || err.message);
          setRows([]);
        } else {
          setRows(
            (c || []).map((x: {
              id: string;
              name?: string;
              phone?: string;
              is_active?: boolean;
              created_at?: string;
            }) => ({
              id: x.id,
              full_name: x.name || null,
              phone: x.phone || null,
              account_type: "customer",
              is_active: x.is_active ?? true,
              created_at: x.created_at,
            }))
          );
        }
      } else {
        setRows((data as CustomerRow[]) || []);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[#14243A]">إدارة العملاء</h2>
        <p className="text-sm text-[#718096]">قائمة حسابات العملاء من النظام</p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-[#D64C4C]">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-[#718096]">جاري التحميل...</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E4E9F0] bg-white py-12 text-center text-sm text-[#718096]">
          لا يوجد عملاء مسجلون بعد
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E4E9F0] bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-[#E4E9F0] bg-[#F6F8FB]">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-[#718096]">الاسم</th>
                <th className="px-4 py-3 text-right font-medium text-[#718096]">الهاتف</th>
                <th className="px-4 py-3 text-right font-medium text-[#718096]">الحالة</th>
                <th className="px-4 py-3 text-right font-medium text-[#718096]">التسجيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E9F0]">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">{r.full_name || "—"}</td>
                  <td className="px-4 py-3 text-[#718096]">{r.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.is_active !== false
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-[#718096]"
                      }`}
                    >
                      {r.is_active !== false ? "نشط" : "موقوف"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#718096]">
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString("ar-EG")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
