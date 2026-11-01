import { supabase } from "@/lib/supabase";

export type CustomerOrderItem = {
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  variant: string | null;
};

export type CustomerOrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  phone: string;
  phoneAlt: string | null;
  governorate: string;
  center: string;
  area: string | null;
  street: string | null;
  apartment: string | null;
  notes: string | null;
  items: CustomerOrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  couponCode: string | null;
  total: number;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerShipment = {
  id: string;
  label: string;
  status: string;
  updatedAt: string;
};

export type OrderDetailResponse =
  | { ok: true; order: CustomerOrderDetail; shipments: CustomerShipment[] }
  | { ok: false; error: string };

export async function fetchOrderDetail(orderId: string): Promise<OrderDetailResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return { ok: false, error: "يجب تسجيل الدخول" };

  const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const body = (await res.json().catch(() => null)) as OrderDetailResponse | null;
  if (!body) return { ok: false, error: "تعذر قراءة الاستجابة" };
  if (!res.ok || !body.ok) {
    return {
      ok: false,
      error: !body.ok ? body.error : "تعذر تحميل الطلب",
    };
  }
  return body;
}
