import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { normalizeHomepageConfig } from "@/lib/homepage-config";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

const ADMIN_EMAIL = "muqatshop@gmail.com";

async function isAdmin(request: Request): Promise<boolean> {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!token || !url || !key) return false;
  const authClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  return !error && data.user?.email?.toLowerCase() === ADMIN_EMAIL;
}

export async function GET(request: Request) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: "غير مصرح" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const client = getSupabaseServiceClient();
    const { data, error } = await client.from("site_settings").select("value").eq("key", "homepage").maybeSingle();
    if (error) return NextResponse.json({ error: "تعذر تحميل الإعدادات" }, { status: 500, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ config: normalizeHomepageConfig(data?.value) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "تعذر تحميل الإعدادات" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  try {
    const body = await request.json();
    const config = normalizeHomepageConfig(body);
    const client = getSupabaseServiceClient();
    const { error } = await client.from("site_settings").upsert({
      key: "homepage",
      value: config,
      updated_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ error: "تعذر حفظ الإعدادات" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "تعذر حفظ الإعدادات" }, { status: 500 });
  }
}
