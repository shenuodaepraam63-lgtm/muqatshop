"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import {
  CAMPAIGN_STATUS_OPTIONS,
  sanitizeCampaignHref,
  validateCampaignDates,
  type CampaignRow,
  type CampaignStatus,
} from "@/lib/campaigns";
import { Loader2, Save, Upload } from "lucide-react";

type FormState = {
  name: string;
  title: string;
  subtitle: string;
  image_url: string;
  mobile_image_url: string;
  link_url: string;
  button_text: string;
  priority: number;
  status: CampaignStatus;
  starts_at: string;
  ends_at: string;
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(v: string): string | null {
  if (!v.trim()) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function CampaignForm({ initial }: { initial?: CampaignRow | null }) {
  const router = useRouter();
  const deskRef = useRef<HTMLInputElement>(null);
  const mobRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"desk" | "mob" | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>({
    name: initial?.name || "",
    title: initial?.title || "",
    subtitle: initial?.subtitle || "",
    image_url: initial?.image_url || "",
    mobile_image_url: initial?.mobile_image_url || "",
    link_url: initial?.link_url || "/shop",
    button_text: initial?.button_text || "تصفح الآن",
    priority: Number(initial?.priority) || 10,
    status: (initial?.status as CampaignStatus) || "draft",
    starts_at: toLocalInput(initial?.starts_at),
    ends_at: toLocalInput(initial?.ends_at),
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const upload = async (file: File | undefined, kind: "desk" | "mob") => {
    if (!file || !file.type.startsWith("image/")) {
      setError("اختر ملف صورة صالح");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("الحد الأقصى لحجم الصورة 8 ميجابايت");
      return;
    }
    setUploading(kind);
    setError("");
    try {
      const url = await uploadToCloudinary(file);
      if (kind === "desk") set("image_url", url);
      else set("mobile_image_url", url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الرفع");
    } finally {
      setUploading(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("الاسم الداخلي مطلوب");
      return;
    }
    if (!form.image_url.trim()) {
      setError("صورة الديسكتوب مطلوبة");
      return;
    }
    const starts = fromLocalInput(form.starts_at);
    const ends = fromLocalInput(form.ends_at);
    const dateErr = validateCampaignDates(starts, ends);
    if (dateErr) {
      setError(dateErr);
      return;
    }

    const payload = {
      name: form.name.trim(),
      title: form.title.trim() || form.name.trim(),
      subtitle: form.subtitle.trim() || null,
      image_url: form.image_url.trim(),
      mobile_image_url: form.mobile_image_url.trim() || null,
      link_url: sanitizeCampaignHref(form.link_url),
      button_text: form.button_text.trim() || "تصفح الآن",
      priority: Number(form.priority) || 0,
      sort_order: Number(form.priority) || 0,
      status: form.status,
      is_active: form.status === "active",
      starts_at: starts,
      ends_at: ends,
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    if (initial?.id) {
      const { error: err } = await supabase
        .from("gallery_slides")
        .update(payload)
        .eq("id", initial.id);
      setSaving(false);
      if (err) {
        setError(err.message);
        return;
      }
    } else {
      const { error: err } = await supabase.from("gallery_slides").insert(payload);
      setSaving(false);
      if (err) {
        setError(err.message);
        return;
      }
    }
    router.push("/admin/campaigns");
    router.refresh();
  };

  const field =
    "w-full border border-[#e4e9f0] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3157D5]/25 bg-white";

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <section className="bg-white border border-[#e4e9f0] rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-ink">بيانات أساسية</h2>
        <div>
          <label className="text-xs text-muted block mb-1">الاسم الداخلي *</label>
          <input className={field} value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">العنوان الظاهر</label>
          <input className={field} value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">الوصف</label>
          <textarea
            className={`${field} min-h-[72px]`}
            value={form.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
          />
        </div>
      </section>

      <section className="bg-white border border-[#e4e9f0] rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-ink">الصور</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted mb-2">ديسكتوب (مستحسن 16:5) *</p>
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#f6f8fb] border border-dashed border-[#e4e9f0]">
              {form.image_url ? (
                <Image src={form.image_url} alt="" fill className="object-cover" sizes="400px" />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-xs text-muted">لا صورة</div>
              )}
            </div>
            <button
              type="button"
              disabled={!!uploading}
              onClick={() => deskRef.current?.click()}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#3157D5]"
            >
              {uploading === "desk" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              رفع / استبدال
            </button>
            <input
              ref={deskRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => upload(e.target.files?.[0], "desk")}
            />
          </div>
          <div>
            <p className="text-xs text-muted mb-2">موبايل (مستحسن 4:5)</p>
            <div className="relative aspect-[4/5] max-h-48 rounded-xl overflow-hidden bg-[#f6f8fb] border border-dashed border-[#e4e9f0]">
              {form.mobile_image_url ? (
                <Image src={form.mobile_image_url} alt="" fill className="object-cover" sizes="240px" />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-xs text-muted px-2 text-center">
                  اختياري — إن فُرغ تُستخدم صورة الديسكتوب
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={!!uploading}
              onClick={() => mobRef.current?.click()}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#3157D5]"
            >
              {uploading === "mob" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              رفع / استبدال
            </button>
            <input
              ref={mobRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => upload(e.target.files?.[0], "mob")}
            />
          </div>
        </div>
      </section>

      <section className="bg-white border border-[#e4e9f0] rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-ink">زر الإجراء والرابط</h2>
        <div>
          <label className="text-xs text-muted block mb-1">نص الزر</label>
          <input className={field} value={form.button_text} onChange={(e) => set("button_text", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">رابط داخلي (مثل /shop أو /products/...)</label>
          <input
            className={field}
            dir="ltr"
            value={form.link_url}
            onChange={(e) => set("link_url", e.target.value)}
            placeholder="/shop"
          />
        </div>
      </section>

      <section className="bg-white border border-[#e4e9f0] rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-ink">الجدولة والأولوية</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted block mb-1">بداية العرض</label>
            <input
              type="datetime-local"
              className={field}
              value={form.starts_at}
              onChange={(e) => set("starts_at", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">نهاية العرض</label>
            <input
              type="datetime-local"
              className={field}
              value={form.ends_at}
              onChange={(e) => set("ends_at", e.target.value)}
            />
          </div>
        </div>
        <p className="text-[11px] text-muted">التوقيت حسب جهازك (يُفضَّل ضبطه بتوقيت مصر).</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted block mb-1">الأولوية (الأعلى يظهر أولًا)</label>
            <input
              type="number"
              className={field}
              value={form.priority}
              onChange={(e) => set("priority", Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">الحالة</label>
            <select
              className={field}
              value={form.status}
              onChange={(e) => set("status", e.target.value as CampaignStatus)}
            >
              {CAMPAIGN_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving || !!uploading}
        className="inline-flex items-center gap-2 bg-[#14243A] text-white font-semibold text-sm px-6 py-3 rounded-xl disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {initial ? "حفظ التعديلات" : "إنشاء الحملة"}
      </button>
    </form>
  );
}
