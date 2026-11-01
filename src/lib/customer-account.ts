import { supabase } from "@/lib/supabase";
import type { AccountIdentity } from "@/lib/account-identity";

/**
 * Resolve customers.id for the signed-in user.
 * Client path first; if RLS blocks insert, fall back to /api/account/ensure-customer.
 */
export async function resolveCustomerId(identity: AccountIdentity): Promise<string | null> {
  if (identity.customerId) return identity.customerId;

  const email = identity.email.toLowerCase().trim();

  const { data: byAuth } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", identity.userId)
    .maybeSingle();
  if (byAuth?.id) return byAuth.id as string;

  const { data: existing } = await supabase
    .from("customers")
    .select("id, auth_user_id")
    .eq("email", email)
    .maybeSingle();

  if (existing?.id) {
    if (!existing.auth_user_id) {
      await supabase
        .from("customers")
        .update({ auth_user_id: identity.userId })
        .eq("id", existing.id);
    }
    return existing.id as string;
  }

  // Try client insert (may fail under RLS)
  const { data: created, error } = await supabase
    .from("customers")
    .insert({
      email,
      name: identity.fullName || email.split("@")[0],
      phone: identity.phone,
      password_hash: `auth:${identity.userId}`,
      email_verified: identity.authEmailConfirmed,
      is_active: true,
      auth_user_id: identity.userId,
    })
    .select("id")
    .maybeSingle();

  if (!error && created?.id) return created.id as string;

  // Server ensure (service role) — fixes RLS-blocked accounts
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) return null;

    const res = await fetch("/api/account/ensure-customer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const body = (await res.json().catch(() => null)) as
      | { ok?: boolean; customerId?: string }
      | null;
    if (body?.ok && body.customerId) return body.customerId;
  } catch {
    /* ignore */
  }

  return null;
}

export type CustomerOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  governorate: string;
  center: string;
  area: string | null;
  street: string | null;
  apartment: string | null;
  phone: string;
  phone_alt: string | null;
  notes: string | null;
  items: unknown;
  subtotal: number;
  shipping: number;
  discount?: number | null;
  coupon_code?: string | null;
  total: number;
  status: string;
  created_at: string;
  updated_at?: string | null;
  customer_id?: string | null;
  customer_email?: string | null;
};

export async function fetchCustomerOrders(customerId: string | null, email: string) {
  const emailNorm = email.toLowerCase().trim();

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, governorate, center, area, street, apartment, phone, phone_alt, notes, items, subtotal, shipping, discount, coupon_code, total, status, created_at, updated_at, customer_id, customer_email"
    )
    .order("created_at", { ascending: false });

  if (customerId) {
    query = query.or(`customer_id.eq.${customerId},customer_email.eq.${emailNorm}`);
  } else {
    // Fallback when customers row cannot be created yet
    query = query.eq("customer_email", emailNorm);
  }

  const { data, error } = await query;

  if (error) return { orders: [] as CustomerOrder[], error: error.message };
  return { orders: (data || []) as CustomerOrder[], error: null };
}

export async function fetchCustomerOrder(
  id: string,
  customerId: string | null,
  email: string
) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, governorate, center, area, street, apartment, phone, phone_alt, notes, items, subtotal, shipping, discount, coupon_code, total, status, created_at, updated_at, customer_id, customer_email"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data)
    return { order: null as CustomerOrder | null, error: error?.message || "غير موجود" };

  const emailNorm = email.toLowerCase().trim();
  const owns =
    (customerId && data.customer_id === customerId) ||
    (data.customer_email && data.customer_email.toLowerCase() === emailNorm);
  if (!owns) return { order: null, error: "غير مصرح" };
  return { order: data as CustomerOrder, error: null };
}

export type CustomerAddress = {
  id: string;
  customer_id: string;
  label: string | null;
  full_name: string;
  phone: string;
  phone_alt: string | null;
  governorate: string;
  center: string;
  area: string | null;
  street: string | null;
  apartment: string | null;
  is_default: boolean;
  created_at?: string;
};
