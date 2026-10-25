import { supabase } from "@/lib/supabase";
import { saveCustomerSession, type CustomerSession } from "@/lib/customer";
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
