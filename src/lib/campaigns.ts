/** Shared campaign types, eligibility, and helpers for homepage ads. */

export type CampaignStatus = "draft" | "active" | "paused" | "archived";

export type CampaignRow = {
  id: string;
  name: string | null;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
  button_text: string | null;
  sort_order: number;
  priority: number;
  is_active: boolean;
  status: CampaignStatus | string;
  starts_at: string | null;
  ends_at: string | null;
  created_at?: string;
  updated_at?: string | null;
};

export type PublicCampaign = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  image: string;
  mobileImage?: string | null;
  buttonText: string;
  priority: number;
};

const INTERNAL_PREFIXES = ["/", "/shop", "/categories", "/products", "/offers", "/more", "/track"];

/** Only allow relative internal paths (no open redirect). */
export function sanitizeCampaignHref(raw: string | null | undefined): string {
  const v = (raw || "").trim();
  if (!v) return "/shop";
  if (v.startsWith("/") && !v.startsWith("//") && !v.includes(":")) {
    return v;
  }
  return "/shop";
}

export function isCampaignEligible(
  row: CampaignRow,
  now: Date = new Date()
): boolean {
  if (row.status !== "active") return false;
  if (!row.image_url?.trim()) return false;
  if (row.starts_at) {
    const s = new Date(row.starts_at);
    if (!Number.isNaN(s.getTime()) && s > now) return false;
  }
  if (row.ends_at) {
    const e = new Date(row.ends_at);
    if (!Number.isNaN(e.getTime()) && e <= now) return false;
  }
  return true;
}

export function sortCampaigns<T extends { priority: number; created_at?: string; id: string }>(
  rows: T[]
): T[] {
  return [...rows].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const ca = a.created_at ? new Date(a.created_at).getTime() : 0;
    const cb = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (cb !== ca) return cb - ca;
    return a.id.localeCompare(b.id);
  });
}

export function toPublicCampaign(row: CampaignRow): PublicCampaign {
  return {
    id: row.id,
    title: (row.title || row.name || "عرض خاص").trim(),
    subtitle: row.subtitle?.trim() || undefined,
    href: sanitizeCampaignHref(row.link_url),
    image: row.image_url,
    mobileImage: row.mobile_image_url,
    buttonText: (row.button_text || "تصفح الآن").trim() || "تصفح الآن",
    priority: Number(row.priority) || 0,
  };
}

export function derivedCampaignLabel(row: CampaignRow, now = new Date()): string {
  if (row.status === "draft") return "مسودة";
  if (row.status === "paused") return "متوقف";
  if (row.status === "archived") return "مؤرشف";
  if (row.starts_at && new Date(row.starts_at) > now) return "مجدول";
  if (row.ends_at && new Date(row.ends_at) <= now) return "منتهي";
  if (row.status === "active") return "نشط";
  return row.status;
}

export const CAMPAIGN_STATUS_OPTIONS: { value: CampaignStatus; label: string }[] = [
  { value: "draft", label: "مسودة" },
  { value: "active", label: "نشط" },
  { value: "paused", label: "متوقف" },
  { value: "archived", label: "مؤرشف" },
];

export function validateCampaignDates(
  startsAt: string | null,
  endsAt: string | null
): string | null {
  if (!startsAt || !endsAt) return null;
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return "تواريخ غير صالحة";
  }
  if (e <= s) return "تاريخ النهاية يجب أن يكون بعد البداية";
  return null;
}

export { INTERNAL_PREFIXES };
