import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { isAdminAuthSuccess, requireAdmin } from "@/lib/admin-auth";

/**
 * Admin product list / create via service role AFTER requireAdmin.
 * Prepared so RLS on products can be tightened without breaking the panel.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!isAdminAuthSuccess(auth)) return auth;

  try {
    const client = getSupabaseServiceClient();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 100), 200);
    const { data, error } = await client
      .from("products")
      .select("id, name, price, stock, is_active, created_at, updated_at")
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
    const body = await req.json();
    const name = String(body.name || "").trim();
    const price = Number(body.price);
    if (!name || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ ok: false, error: "اسم وسعر صالحان مطلوبان" }, { status: 400 });
    }

    const client = getSupabaseServiceClient();
    const payload: Record<string, unknown> = {
      name,
      price,
      stock: Number.isFinite(Number(body.stock)) ? Number(body.stock) : 0,
      is_active: body.is_active !== false,
    };
    // Pass through only known safe optional fields
    for (const key of [
      "description",
      "image_url",
      "category_id",
      "compare_at_price",
      "slug",
    ] as const) {
      if (body[key] !== undefined) payload[key] = body[key];
    }

    const { data, error } = await client
      .from("products")
      .insert(payload)
      .select("id, name, price, stock, is_active")
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
