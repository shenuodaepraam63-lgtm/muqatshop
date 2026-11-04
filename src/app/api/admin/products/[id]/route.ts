import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { isAdminAuthSuccess, requireAdmin } from "@/lib/admin-auth";

const PATCH_KEYS = [
  "name",
  "price",
  "stock",
  "is_active",
  "description",
  "image_url",
  "category_id",
  "compare_at_price",
  "slug",
] as const;

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!isAdminAuthSuccess(auth)) return auth;

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "معرّف مطلوب" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    for (const key of PATCH_KEYS) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (patch.price != null && (!Number.isFinite(Number(patch.price)) || Number(patch.price) < 0)) {
      return NextResponse.json({ ok: false, error: "سعر غير صالح" }, { status: 400 });
    }

    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from("products")
      .update(patch)
      .eq("id", id)
      .select("id, name, price, stock, is_active")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ ok: false, error: "غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, product: data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!isAdminAuthSuccess(auth)) return auth;

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "معرّف مطلوب" }, { status: 400 });
  }

  try {
    const client = getSupabaseServiceClient();
    // Soft-deactivate preferred over hard delete
    const { data, error } = await client
      .from("products")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, is_active")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ ok: false, error: "غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, product: data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}
