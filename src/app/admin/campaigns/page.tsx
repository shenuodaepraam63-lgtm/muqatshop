"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { adminMutate } from "@/lib/admin-mutate";
import { supabase } from "@/lib/supabase";
import {
  CAMPAIGN_STATUS_OPTIONS,
  derivedCampaignLabel,
  type CampaignRow,
  type CampaignStatus,
} from "@/lib/campaigns";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Pause,
  Play,
  Archive,
} from "lucide-react";

export default function AdminCampaignsPage() {
  const [rows, setRows] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState<"all" | CampaignStatus | "scheduled" | "expired">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery_slides")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) setMsg(error.message);
    setRows((data as CampaignRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const now = useMemo(() => new Date(), [rows]);

  const stats = useMemo(() => {
    let active = 0,
      scheduled = 0,
      paused = 0,
      expired = 0,
      draft = 0;
    for (const r of rows) {
      const label = derivedCampaignLabel(r, now);
      if (label === "نشط") active++;
      else if (label === "مجدول") scheduled++;
      else if (label === "متوقف") paused++;
      else if (label === "منتهي") expired++;
      else if (label === "مسودة") draft++;
    }
    return { total: rows.length, active, scheduled, paused, expired, draft };
  }, [rows, now]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const label = derivedCampaignLabel(r, now);
      if (filter === "all") return true;
      if (filter === "scheduled") return label === "مجدول";
      if (filter === "expired") return label === "منتهي";
      return r.status === filter;
    });
  }, [rows, filter, now]);

  const setStatus = async (id: string, status: CampaignStatus) => {
    const patch = {
      status,
      is_active: status === "active",
      updated_at: new Date().toISOString(),
    };
    try {
      await adminMutate({ table: "gallery_slides", op: "update", id, data: patch });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      setMsg("تم تحديث الحالة");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "فشل التحديث");
    }
  };

  const duplicate = async (r: CampaignRow) => {
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = r as CampaignRow & {
      id: string;
    };
    const payload = {
      ...rest,
      name: `${r.name || r.title || "حملة"} (نسخة)`,
      title: r.title,
      status: "draft",
      is_active: false,
      priority: Number(r.priority) || 0,
    };
    delete (payload as { id?: string }).id;
    try {
      await adminMutate({ table: "gallery_slides", op: "insert", data: payload as Record<string, unknown> });
      setMsg("تم نسخ الحملة كمسودة");
      void load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "فشل النسخ");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذه الحملة نهائيًا؟")) return;
    try {
      await adminMutate({ table: "gallery_slides", op: "delete", id });
      setRows((prev) => prev.filter((r) => r.id !== id));
      setMsg("تم الحذف");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "فشل الحذف");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> جاري التحميل...
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">الحملات الإعلانية</h1>
          <p className="text-sm text-muted mt-1">
            بانرات الرئيسية بأسلوب احترافي — جدولة، أولوية، صور ديسكتوب وموبايل
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="inline-flex items-center gap-2 bg-[#14243A] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1e3554] transition"
        >
          <Plus className="w-4 h-4" /> حملة جديدة
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {[
          { k: "all" as const, label: "الكل", n: stats.total },
          { k: "active" as const, label: "نشط", n: stats.active },
          { k: "scheduled" as const, label: "مجدول", n: stats.scheduled },
          { k: "paused" as const, label: "متوقف", n: stats.paused },
          { k: "expired" as const, label: "منتهي", n: stats.expired },
          { k: "draft" as const, label: "مسودة", n: stats.draft },
        ].map((s) => (
          <button
            key={s.k}
            type="button"
            onClick={() => setFilter(s.k)}
            className={`rounded-xl border px-3 py-2.5 text-right transition ${
              filter === s.k
                ? "border-[#3157D5] bg-[#3157D5]/10"
                : "border-[#e4e9f0] bg-white hover:border-[#3157D5]/40"
            }`}
          >
            <p className="text-lg font-bold text-ink">{s.n}</p>
            <p className="text-[11px] text-muted">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#e4e9f0] rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-muted text-sm py-12">لا توجد حملات</p>
        ) : (
          <ul className="divide-y divide-[#e4e9f0]">
            {filtered.map((r) => {
              const label = derivedCampaignLabel(r, now);
              return (
                <li key={r.id} className="flex gap-3 p-4 items-start hover:bg-[#f6f8fb]/80">
                  <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-[#e4e9f0] shrink-0">
                    {r.image_url ? (
                      <Image src={r.image_url} alt="" fill className="object-cover" sizes="96px" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm text-ink truncate">
                        {r.name || r.title || "بدون اسم"}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          label === "نشط"
                            ? "bg-emerald-50 text-emerald-700"
                            : label === "مجدول"
                              ? "bg-blue-50 text-blue-700"
                              : label === "متوقف"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {label}
                      </span>
                      <span className="text-[10px] text-muted">أولوية {r.priority ?? 0}</span>
                    </div>
                    {r.title && (
                      <p className="text-xs text-muted mt-0.5 line-clamp-1">{r.title}</p>
                    )}
                    <p className="text-[11px] text-muted mt-1" dir="ltr">
                      {r.starts_at ? new Date(r.starts_at).toLocaleString("ar-EG") : "—"}
                      {" → "}
                      {r.ends_at ? new Date(r.ends_at).toLocaleString("ar-EG") : "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 shrink-0">
                    <Link
                      href={`/admin/campaigns/${r.id}`}
                      className="p-2 rounded-lg border border-[#e4e9f0] hover:bg-white"
                      title="تعديل"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => duplicate(r)}
                      className="p-2 rounded-lg border border-[#e4e9f0]"
                      title="نسخ"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {r.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => setStatus(r.id, "paused")}
                        className="p-2 rounded-lg border border-[#e4e9f0] text-amber-600"
                        title="إيقاف"
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setStatus(r.id, "active")}
                        className="p-2 rounded-lg border border-[#e4e9f0] text-emerald-600"
                        title="تفعيل"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setStatus(r.id, "archived")}
                      className="p-2 rounded-lg border border-[#e4e9f0]"
                      title="أرشفة"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      className="p-2 rounded-lg border border-[#e4e9f0] text-red-500"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-muted">
        الحالات المخزّنة:{" "}
        {CAMPAIGN_STATUS_OPTIONS.map((o) => o.label).join(" · ")}. المجدول/المنتهي يُحسبان من
        التواريخ.
      </p>
      {msg && <p className="text-sm text-muted">{msg}</p>}
    </div>
  );
}
