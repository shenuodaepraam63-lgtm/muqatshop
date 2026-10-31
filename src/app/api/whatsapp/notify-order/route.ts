import { NextRequest, NextResponse } from "next/server";
import { notifyOrderReceived } from "@/lib/whatsapp/notify-order";

export const runtime = "nodejs";

/**
 * Fire-and-forget helper after order insert.
 * Body: { order_number: string }
 * Never fails the storefront checkout flow on WhatsApp errors.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderNumber = String(body.order_number || "").trim();
    if (!orderNumber) {
      return NextResponse.json({ ok: false, error: "missing_order" }, { status: 400 });
    }

    const result = await notifyOrderReceived(orderNumber);
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ ok: true, sent: false, reason: "internal" });
  }
}
