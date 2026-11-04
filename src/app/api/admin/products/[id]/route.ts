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

export async function GET(
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
    const { data, error } = await client
      .from("products")
      .select("*")
      .eq("id", id)
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
    const body = (await req.json()) as Record<string, unknown>;
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    for (const key of WRITE_KEYS) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (patch.price != null) {
      const price = Number(patch.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ ok: false, error: "سعر غير صالح" }, { status: 400 });
      }
      patch.price = price;
    }

    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from("products")
      .update(patch)
      .eq("id", id)
      .select("*")
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
    const hard = new URL(req.url).searchParams.get("hard") === "1";

    if (hard) {
      const { error } = await client.from("products").delete().eq("id", id);
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, deleted: true });
    }

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
