"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { adminJson } from "@/lib/admin-api";
import { hashPassword, makeMerchantCode } from "@/lib/merchant";

type AppRow = {
  id: string;
  customer_id: string;
  name: string;
  email: string;
  phone: string | null;
  note: string | null;
  status: string;
  created_at: string;
};

export default function AdminmApplicationsPage() {
  const [list, setList] = useState<AppRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("merchant_applications")
      .select("*")
      .order("created_at", { ascending: false });
    setList((data as AppRow[]) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (app: AppRow) => {
    if (!confirm(`الموافقة على ${app.name} كتاجر؟`)) return;
    setBusy(app.id);
    setMsg("");
    try {
      const tempPass = `Mq${Math.random().toString(36).slice(2, 8)}!`;
      const password_hash = await hashPassword(tempPass);
      const code = makeMerchantCode(app.id);
      await adminJson("/api/admin/merchant-ops", {
        method: "POST",
        body: JSON.stringify({
          action: "approve_application",
          applicationId: app.id,
          name: app.name,
          email: app.email,
          phone: app.phone,
          passwordHash: password_hash,
          code,
          tempPassNote: `تمت الموافقة على طلبك. كود التاجر: ${code}. سجّل الدخول من /merchant/login ببريدك. كلمة المرور المؤقتة: ${tempPass} — غيّرها بعد الدخول إن أمكن عبر الدعم.`,
        }),
      });
      setMsg(`تمت الموافقة. كلمة المرور المؤقتة: ${tempPass}`);
      void load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "فشل الموافقة");
    }
    setBusy(null);
  };

  const reject = async (id: string) => {
    if (!confirm("رفض الطلب؟")) return;
    setBusy(id);
    try {
      await adminJson("/api/admin/merchant-ops", {
        method: "POST",
        body: JSON.stringify({ action: "reject_application", applicationId: id }),
      });
      void load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "فشل الرفض");
    }
    setBusy(null);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">طلبات التحويل لتاجر</h1>
      {msg && <p className="text-sm bg-white border rounded-xl px-3 py-2">{msg}</p>}
      {list.length === 0 && <p className="text-sm text-muted">لا توجد طلبات</p>}
      {list.map((a) => (
        <div key={a.id} className="bg-white border rounded-2xl p-4 text-sm space-y-2">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-semibold">{a.name}</p>
              <p className="text-muted" dir="ltr">{a.email}</p>
              <p className="text-muted">{a.phone || "—"}</p>
            </div>
            <span
              className={`text-xs h-fit px-2 py-1 rounded-full ${
                a.status === "pending"
                  ? "bg-amber-50 text-amber-800"
                  : a.status === "approved"
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-muted"
              }`}
            >
              {a.status === "pending" ? "قيد المراجعة" : a.status === "approved" ? "موافق" : "مرفوض"}
            </span>
          </div>
          {a.note && <p className="text-xs text-muted border-t pt-2">{a.note}</p>}
          <p className="text-[11px] text-muted">{new Date(a.created_at).toLocaleString("ar-EG")}</p>
          {a.status === "pending" && (
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={busy === a.id}
                onClick={() => approve(a)}
                className="bg-ink text-white text-xs px-4 py-2 rounded-full disabled:opacity-50"
              >
                موافقة وإنشاء تاجر
              </button>
              <button
                type="button"
                disabled={busy === a.id}
                onClick={() => reject(a.id)}
                className="border text-xs px-4 py-2 rounded-full disabled:opacity-50"
              >
                رفض
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
