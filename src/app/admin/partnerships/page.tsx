"use client";

import { useEffect, useState } from "react";
import { adminMutate } from "@/lib/admin-mutate";
import { supabase } from "@/lib/supabase";

type ProfileSnippet = { full_name: string | null; phone: string | null };

type AffRow = {
  user_id: string;
  status: string;
  marketing_channels: string[] | null;
  marketing_url: string | null;
  application_date: string | null;
  profiles: ProfileSnippet | null;
};

type SupRow = {
  user_id: string;
  status: string;
  business_name: string;
  business_type: string | null;
  governorate: string | null;
  application_date: string | null;
  profiles: ProfileSnippet | null;
};

function pickProfile(raw: unknown): ProfileSnippet | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const first = raw[0] as ProfileSnippet | undefined;
    return first
      ? { full_name: first.full_name ?? null, phone: first.phone ?? null }
      : null;
  }
  if (typeof raw === "object") {
    const o = raw as ProfileSnippet;
    return { full_name: o.full_name ?? null, phone: o.phone ?? null };
  }
  return null;
}

export default function AdminPartnershipsPage() {
  const [affiliates, setAffiliates] = useState<AffRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupRow[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setErr("");
    const [a, s] = await Promise.all([
      supabase
        .from("affiliate_profiles")
        .select(
          "user_id, status, marketing_channels, marketing_url, application_date, profiles(full_name, phone)"
        )
        .order("application_date", { ascending: false }),
      supabase
        .from("supplier_profiles")
        .select(
          "user_id, status, business_name, business_type, governorate, application_date, profiles(full_name, phone)"
        )
        .order("application_date", { ascending: false }),
    ]);

    if (a.error) setErr(a.error.message);
    if (s.error) setErr((e) => e || s.error!.message);

    const affRows: AffRow[] = (a.data || []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        user_id: String(r.user_id),
        status: String(r.status || "pending"),
        marketing_channels: (r.marketing_channels as string[] | null) || null,
        marketing_url: (r.marketing_url as string | null) || null,
        application_date: (r.application_date as string | null) || null,
        profiles: pickProfile(r.profiles),
      };
    });

    const supRows: SupRow[] = (s.data || []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        user_id: String(r.user_id),
        status: String(r.status || "pending"),
        business_name: String(r.business_name || ""),
        business_type: (r.business_type as string | null) || null,
        governorate: (r.governorate as string | null) || null,
        application_date: (r.application_date as string | null) || null,
        profiles: pickProfile(r.profiles),
      };
    });

    setAffiliates(affRows);
    setSuppliers(supRows);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function setAffiliateStatus(userId: string, status: string) {
    setMsg("");
    setErr("");
    const patch: Record<string, unknown> = { status };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    try {
      await adminMutate({
        table: "affiliate_profiles",
        op: "update",
        match: { user_id: userId },
        data: patch,
      });
      setMsg(`تم تحديث حالة المسوق إلى ${status}`);
      void load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "فشل التحديث");
    }
  }

  async function setSupplierStatus(userId: string, status: string) {
    setMsg("");
    setErr("");
    const patch: Record<string, unknown> = { status };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    try {
      await adminMutate({
        table: "supplier_profiles",
        op: "update",
        match: { user_id: userId },
        data: patch,
      });
      setMsg(`تم تحديث حالة التاجر إلى ${status}`);
      void load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "فشل التحديث");
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-[#14243A]">طلبات الشراكة</h1>
        <p className="text-sm text-[#718096] mt-1">اعتماد المسوقين والتجار (MQS-AUTH-002)</p>
      </div>

      {msg ? <p className="text-sm text-[#21865B]">{msg}</p> : null}
      {err ? <p className="text-sm text-[#D64C4C]">{err}</p> : null}
      {loading ? <p className="text-sm text-[#718096]">جاري التحميل...</p> : null}

      <section className="space-y-3">
        <h2 className="font-semibold text-[#202B3C]">المسوقون ({affiliates.length})</h2>
        <div className="space-y-2">
          {affiliates.map((row) => (
            <div key={row.user_id} className="rounded-xl border border-[#E4E9F0] bg-white p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold">{row.profiles?.full_name || row.user_id}</p>
                  <p className="text-[#718096]">{row.profiles?.phone || "—"}</p>
                  <p className="text-xs text-[#718096] mt-1">
                    {(row.marketing_channels || []).join(" · ") || "بدون قنوات"}
                    {row.marketing_url ? ` · ${row.marketing_url}` : ""}
                  </p>
                </div>
                <span className="font-semibold text-[#3157D5]">{row.status}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-[#21865B] text-white px-3 py-1.5 text-xs font-semibold"
                  onClick={() => setAffiliateStatus(row.user_id, "approved")}
                >
                  موافقة
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-[#D64C4C] text-white px-3 py-1.5 text-xs font-semibold"
                  onClick={() => setAffiliateStatus(row.user_id, "rejected")}
                >
                  رفض
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[#E4E9F0] px-3 py-1.5 text-xs font-semibold"
                  onClick={() => setAffiliateStatus(row.user_id, "needs_information")}
                >
                  طلب بيانات
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[#E4E9F0] px-3 py-1.5 text-xs font-semibold"
                  onClick={() => setAffiliateStatus(row.user_id, "suspended")}
                >
                  إيقاف
                </button>
              </div>
            </div>
          ))}
          {!loading && affiliates.length === 0 ? (
            <p className="text-sm text-[#718096]">لا توجد طلبات مسوقين.</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-[#202B3C]">التجار ({suppliers.length})</h2>
        <div className="space-y-2">
          {suppliers.map((row) => (
            <div key={row.user_id} className="rounded-xl border border-[#E4E9F0] bg-white p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold">{row.business_name}</p>
                  <p className="text-[#718096]">
                    {row.profiles?.full_name || "—"} · {row.business_type || "—"} ·{" "}
                    {row.governorate || "—"}
                  </p>
                </div>
                <span className="font-semibold text-[#3157D5]">{row.status}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-[#21865B] text-white px-3 py-1.5 text-xs font-semibold"
                  onClick={() => setSupplierStatus(row.user_id, "approved")}
                >
                  موافقة
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-[#D64C4C] text-white px-3 py-1.5 text-xs font-semibold"
                  onClick={() => setSupplierStatus(row.user_id, "rejected")}
                >
                  رفض
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[#E4E9F0] px-3 py-1.5 text-xs font-semibold"
                  onClick={() => setSupplierStatus(row.user_id, "needs_information")}
                >
                  طلب بيانات
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[#E4E9F0] px-3 py-1.5 text-xs font-semibold"
                  onClick={() => setSupplierStatus(row.user_id, "suspended")}
                >
                  إيقاف
                </button>
              </div>
            </div>
          ))}
          {!loading && suppliers.length === 0 ? (
            <p className="text-sm text-[#718096]">لا توجد طلبات تجار.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
