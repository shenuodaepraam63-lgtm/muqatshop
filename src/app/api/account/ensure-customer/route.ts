import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

/**
 * Ensure a customers row for the authenticated Auth user.
 * Uses service role to bypass RLS that blocks client inserts on customers.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";

    if (!token) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    let admin;
    try {
      admin = getSupabaseServiceClient();
    } catch {
      return NextResponse.json(
        { ok: false, error: "إعدادات الخادم غير مكتملة" },
        { status: 503 }
      );
    }

    const {
      data: { user },
      error: userErr,
    } = await admin.auth.getUser(token);

    if (userErr || !user?.id || !user.email) {
      return NextResponse.json({ ok: false, error: "جلسة غير صالحة" }, { status: 401 });
    }

    const email = user.email.toLowerCase().trim();
    const metaName =
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
      email.split("@")[0];
    const metaPhone =
      typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null;

    // 1) by auth_user_id
    const { data: byAuth } = await admin
      .from("customers")
      .select("id, email, name, phone")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (byAuth?.id) {
      return NextResponse.json({
        ok: true,
        customerId: byAuth.id,
        email: byAuth.email || email,
      });
    }

    // 2) by email
    const { data: byEmail } = await admin
      .from("customers")
      .select("id, email, name, phone, auth_user_id")
      .eq("email", email)
      .maybeSingle();

    if (byEmail?.id) {
      if (!byEmail.auth_user_id) {
        await admin
          .from("customers")
          .update({
            auth_user_id: user.id,
            email_verified: true,
            name: byEmail.name || metaName,
            phone: byEmail.phone || metaPhone,
          })
          .eq("id", byEmail.id);
      }
      return NextResponse.json({
        ok: true,
        customerId: byEmail.id,
        email,
      });
    }

    // 3) create
    const { data: created, error: insErr } = await admin
      .from("customers")
      .insert({
        email,
        name: metaName,
        phone: metaPhone,
        password_hash: `auth:${user.id}`,
        email_verified: !!user.email_confirmed_at,
        is_active: true,
        auth_user_id: user.id,
      })
      .select("id")
      .maybeSingle();

    if (insErr || !created?.id) {
      return NextResponse.json(
        { ok: false, error: insErr?.message || "تعذر إنشاء ملف العميل" },
        { status: 500 }
      );
    }

    // best-effort link profiles.legacy_customer_id
    await admin
      .from("profiles")
      .update({ legacy_customer_id: created.id })
      .eq("id", user.id)
      .is("legacy_customer_id", null);

    return NextResponse.json({ ok: true, customerId: created.id, email });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
