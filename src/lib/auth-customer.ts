import { supabase } from "@/lib/supabase";
import { saveCustomerSession, type CustomerSession } from "@/lib/customer";
import {
  saveMerchantSession,
  makeMerchantCode,
  type MerchantSession,
} from "@/lib/merchant";
import { setSiteRole } from "@/lib/role";

const SITE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || "https://muqatshop.vercel.app";

export function authRedirectTo(path: string) {
  const base = SITE_URL.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** بعد جلسة Auth ناجحة: مزامنة صف customers + جلسة الواجهة */
export async function syncCustomerFromAuthUser(opts?: {
  name?: string;
}): Promise<{ ok: true; session: CustomerSession } | { ok: false; error: string }> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return { ok: false, error: error?.message || "لا توجد جلسة مستخدم" };
  }

  const email = user.email.toLowerCase();
  const metaName =
    opts?.name ||
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "") ||
    email.split("@")[0];

  const { data: existing } = await supabase
    .from("customers")
    .select("id, name, phone, email")
    .eq("email", email)
    .maybeSingle();

  let row = existing;

  if (!existing) {
    const { data: inserted, error: insErr } = await supabase
      .from("customers")
      .insert({
        email,
        name: metaName,
        password_hash: `auth:${user.id}`,
        email_verified: true,
        is_active: true,
      })
      .select("id, name, phone, email")
      .maybeSingle();
    if (insErr || !inserted) {
      return { ok: false, error: insErr?.message || "تعذر إنشاء ملف العميل" };
    }
    row = inserted;
  } else {
    await supabase
      .from("customers")
      .update({
        email_verified: true,
        name: opts?.name || existing.name || metaName,
      })
      .eq("id", existing.id);
    row = {
      ...existing,
      name: opts?.name || existing.name || metaName,
    };
  }

  if (!row) return { ok: false, error: "تعذر مزامنة الحساب" };

  const session: CustomerSession = {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
  };
  saveCustomerSession(session);
  setSiteRole("customer");
  return { ok: true, session };
}

/** بعد تأكيد بريد التاجر: مزامنة merchants + محفظة + جلسة */
export async function syncMerchantFromAuthUser(opts?: {
  name?: string;
  phone?: string | null;
}): Promise<{ ok: true; session: MerchantSession } | { ok: false; error: string }> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return { ok: false, error: error?.message || "لا توجد جلسة مستخدم" };
  }

  if (!user.email_confirmed_at) {
    return { ok: false, error: "البريد غير مؤكد بعد — افتح رابط التأكيد في بريدك" };
  }

  const email = user.email.toLowerCase();
  const metaName =
    opts?.name ||
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "") ||
    email.split("@")[0];
  const metaPhone =
    opts?.phone !== undefined
      ? opts.phone
      : typeof user.user_metadata?.phone === "string"
        ? user.user_metadata.phone
        : null;

  const { data: existing } = await supabase
    .from("merchants")
    .select("id, name, phone, email, code, is_active")
    .eq("email", email)
    .maybeSingle();

  let row = existing;

  if (!existing) {
    const { data: inserted, error: insErr } = await supabase
      .from("merchants")
      .insert({
        email,
        name: metaName,
        phone: metaPhone || null,
        password_hash: `auth:${user.id}`,
        is_active: true,
        email_verified: true,
      })
      .select("id, name, phone, email, code, is_active")
      .maybeSingle();

    if (insErr || !inserted) {
      return { ok: false, error: insErr?.message || "تعذر إنشاء حساب التاجر" };
    }

    const code = makeMerchantCode(inserted.id);
    await supabase.from("merchants").update({ code }).eq("id", inserted.id);

    await supabase.from("merchant_wallets").insert({
      merchant_id: inserted.id,
      balance: 0,
      pending: 0,
    });

    await supabase.from("merchant_messages").insert({
      merchant_id: inserted.id,
      body: `مرحبًا ${metaName}! تم تأكيد بريدك وإنشاء حساب التاجر. كودك: ${code}.`,
    });

    row = { ...inserted, code };
  } else {
    if (!existing.is_active) {
      return { ok: false, error: "حساب التاجر موقوف" };
    }
    const code = existing.code || makeMerchantCode(existing.id);
    await supabase
      .from("merchants")
      .update({
        email_verified: true,
        name: opts?.name || existing.name || metaName,
        phone: metaPhone !== null && metaPhone !== undefined ? metaPhone : existing.phone,
        code,
        password_hash: `auth:${user.id}`,
      })
      .eq("id", existing.id);

    const { data: wallet } = await supabase
      .from("merchant_wallets")
      .select("merchant_id")
      .eq("merchant_id", existing.id)
      .maybeSingle();
    if (!wallet) {
      await supabase.from("merchant_wallets").insert({
        merchant_id: existing.id,
        balance: 0,
        pending: 0,
      });
    }

    row = {
      ...existing,
      code,
      name: opts?.name || existing.name || metaName,
    };
  }

  if (!row) return { ok: false, error: "تعذر مزامنة حساب التاجر" };

  const session: MerchantSession = {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    code: row.code,
  };
  saveMerchantSession(session);
  setSiteRole("merchant");
  return { ok: true, session };
}
