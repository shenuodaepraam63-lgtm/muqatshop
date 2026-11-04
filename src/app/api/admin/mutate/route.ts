import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { isAdminAuthSuccess, requireAdmin } from "@/lib/admin-auth";

/**
 * Allowlisted admin table mutations after requireAdmin.
 * Service role is used only after successful admin verification.
 */
const TABLES = {
  categories: {
    ops: ["insert", "update", "delete"] as const,
    keys: [
      "name",
      "slug",
      "group_id",
      "parent_id",
      "sort_order",
      "is_active",
      "image_url",
      "description",
    ],
  },
  category_groups: {
    ops: ["insert", "update", "delete"] as const,
    keys: ["name", "slug", "sort_order", "is_active"],
  },
  coupons: {
    ops: ["insert", "update", "delete"] as const,
    keys: [
      "code",
      "discount_type",
      "discount_value",
      "min_order",
      "max_uses",
      "uses_count",
      "is_active",
      "starts_at",
      "ends_at",
      "description",
    ],
  },
  gallery_slides: {
    ops: ["insert", "update", "delete"] as const,
    keys: [
      "title",
      "subtitle",
      "image_url",
      "link_url",
      "sort_order",
      "is_active",
      "cta_label",
      "campaign_id",
      "starts_at",
      "ends_at",
      "meta",
    ],
  },
  site_settings: {
    ops: ["upsert"] as const,
    keys: ["key", "value", "updated_at"],
  },
  detail_section_presets: {
    ops: ["insert", "delete"] as const,
    keys: ["title", "body", "sort_order"],
  },
  admin_notifications: {
    ops: ["update"] as const,
    keys: ["read_at"],
  },
  partnership_applications: {
    ops: ["update"] as const,
    keys: ["status", "notes", "reviewed_at", "admin_notes"],
  },
  merchant_applications: {
    ops: ["update"] as const,
    keys: ["status", "notes", "reviewed_at", "admin_notes"],
  },
} as const;

type TableName = keyof typeof TABLES;

function pick(
  keys: readonly string[],
  body: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!isAdminAuthSuccess(auth)) return auth;

  let body: {
    table?: string;
    op?: string;
    id?: string;
    match?: Record<string, unknown>;
    data?: Record<string, unknown>;
    select?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "بيانات غير صالحة" }, { status: 400 });
  }

  const table = body.table as TableName;
  const op = body.op as string;
  if (!table || !(table in TABLES)) {
    return NextResponse.json({ ok: false, error: "جدول غير مسموح" }, { status: 400 });
  }
  const cfg = TABLES[table];
  if (!(cfg.ops as readonly string[]).includes(op)) {
    return NextResponse.json({ ok: false, error: "عملية غير مسموحة" }, { status: 400 });
  }

  try {
    const client = getSupabaseServiceClient();
    const data = pick(cfg.keys, body.data || {});

    if (op === "insert") {
      let q = client.from(table).insert(data);
      if (body.select) q = q.select(body.select) as typeof q;
      else q = q.select("*") as typeof q;
      const { data: row, error } = await q.maybeSingle();
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, data: row });
    }

    if (op === "upsert") {
      if (table !== "site_settings") {
        return NextResponse.json({ ok: false, error: "upsert غير مدعوم" }, { status: 400 });
      }
      if (!data.key) {
        return NextResponse.json({ ok: false, error: "key مطلوب" }, { status: 400 });
      }
      const { data: row, error } = await client
        .from("site_settings")
        .upsert(data, { onConflict: "key" })
        .select("*")
        .maybeSingle();
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, data: row });
    }

    if (op === "update") {
      let q = client.from(table).update(data);
      if (body.id) q = q.eq("id", body.id);
      else if (body.match) {
        for (const [k, v] of Object.entries(body.match)) {
          q = q.eq(k, v as string);
        }
      } else {
        return NextResponse.json({ ok: false, error: "id أو match مطلوب" }, { status: 400 });
      }
      const { data: rows, error } = await q.select("*");
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, data: rows });
    }

    if (op === "delete") {
      let q = client.from(table).delete();
      if (body.id) q = q.eq("id", body.id);
      else if (body.match) {
        for (const [k, v] of Object.entries(body.match)) {
          q = q.eq(k, v as string);
        }
      } else {
        return NextResponse.json({ ok: false, error: "id أو match مطلوب" }, { status: 400 });
      }
      const { error } = await q;
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, deleted: true });
    }

    return NextResponse.json({ ok: false, error: "عملية غير معروفة" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}
