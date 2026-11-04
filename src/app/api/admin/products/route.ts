import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { isAdminAuthSuccess, requireAdmin } from "@/lib/admin-auth";

const WRITE_KEYS = [
  "name",
  "slug",
  "description",
  "price",
  "compare_at_price",
  "sale_ends_at",
  "category_id",
  "product_type",
  "brand",
  "material",
  "colors",
  "sizes",
  "variants",
  "features",
  "specs",
  "weight",
  "weight_value",
  "dimensions",
  "origin_country",
  "care_instructions",
  "detail_sections",
  "images",
  "main_image_index",
  "stock",
  "is_featured",
  "is_active",
] as const;

function pickPayload(body: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};
  for (const key of WRITE_KEYS) {
    if (body[key] !== undefined) payload[key] = body[key];
  }
  return payload;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!isAdminAuthSuccess(auth)) return auth;

  try {
    const client = getSupabaseServiceClient();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 200), 500);
    const { data, error } = await client
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, products: data || [] });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!isAdminAuthSuccess(auth)) return auth;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const name = String(body.name || "").trim();
    const price = Number(body.price);
    if (!name || !Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { ok: false, error: "اسم وسعر صالحان مطلوبان" },
        { status: 400 }
      );
    }

    const payload = pickPayload(body);
    payload.name = name;
    payload.price = price;
    if (payload.stock == null) payload.stock = 0;
    if (payload.is_active == null) payload.is_active = true;

    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from("products")
      .insert(payload)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, product: data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}
