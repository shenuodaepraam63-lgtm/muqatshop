import { supabase } from "@/lib/supabase";
import type { AccountIdentity } from "@/lib/account-identity";

/** Resolve legacy customers.id for the signed-in user (create thin row if missing). */
export async function resolveCustomerId(identity: AccountIdentity): Promise<string | null> {
  if (identity.customerId) return identity.customerId;

  const email = identity.email.toLowerCase().trim();
  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("customers")
      .update({ auth_user_id: identity.userId })
      .eq("id", existing.id)
      .is("auth_user_id", null);
    return existing.id as string;
  }

  const { data: created, error } = await supabase
    .from("customers")
    .insert({
      email,
      name: identity.fullName || email.split("@")[0],
      phone: identity.phone,
      password_hash: "supabase_auth",
      email_verified: identity.authEmailConfirmed,
      is_active: true,
      auth_user_id: identity.userId,
    })
    .select("id")
    .maybeSingle();

  if (error || !created?.id) return null;
  return created.id as string;
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

export async function fetchCustomerOrders(customerId: string, email: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, governorate, center, area, street, apartment, phone, phone_alt, notes, items, subtotal, shipping, discount, coupon_code, total, status, created_at, updated_at, customer_id, customer_email"
    )
    .or(`customer_id.eq.${customerId},customer_email.eq.${email.toLowerCase()}`)
    .order("created_at", { ascending: false });

  if (error) return { orders: [] as CustomerOrder[], error: error.message };
  return { orders: (data || []) as CustomerOrder[], error: null };
}

export async function fetchCustomerOrder(id: string, customerId: string, email: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, governorate, center, area, street, apartment, phone, phone_alt, notes, items, subtotal, shipping, discount, coupon_code, total, status, created_at, updated_at, customer_id, customer_email"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return { order: null as CustomerOrder | null, error: error?.message || "غير موجود" };

  const owns =
    data.customer_id === customerId ||
    (data.customer_email && data.customer_email.toLowerCase() === email.toLowerCase());
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
