import { NextResponse } from "next/server";
import { normalizeHomepageConfig } from "@/lib/homepage-config";
import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { isAdminAuthSuccess, requireAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!isAdminAuthSuccess(auth)) return auth;

  try {
    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from("site_settings")
      .select("value")
      .eq("key", "homepage")
      .maybeSingle();
    if (error) {
      return NextResponse.json(
        { error: "تعذر تحميل الإعدادات" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { config: normalizeHomepageConfig(data?.value) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "تعذر تحميل الإعدادات" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if (!isAdminAuthSuccess(auth)) return auth;

  try {
    const body = await request.json();
    const config = normalizeHomepageConfig(body);
    const client = getSupabaseServiceClient();
    const { error } = await client.from("site_settings").upsert({
      key: "homepage",
      value: config,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      return NextResponse.json({ error: "تعذر حفظ الإعدادات" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "تعذر حفظ الإعدادات" }, { status: 500 });
  }
}
