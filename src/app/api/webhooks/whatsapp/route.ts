import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Meta calls GET when you subscribe the WhatsApp webhook.
 * The verify token must exactly match WHATSAPP_VERIFY_TOKEN in Vercel.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    return new NextResponse("Webhook verification is not configured", {
      status: 500,
    });
  }

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * Meta sends WhatsApp webhook notifications here.
 * Verify the signature against the raw request body before parsing it.
 */
export async function POST(req: NextRequest) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json(
      { ok: false, error: "META_APP_SECRET is not configured" },
      { status: 500 }
    );
  }

  const signature = req.headers.get("x-hub-signature-256") || "";
  const rawBody = await req.text();
  const expectedSignature =
    "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");

  const supplied = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  try {
    const payload = JSON.parse(rawBody) as {
      object?: string;
      entry?: Array<{ changes?: Array<{ field?: string }> }>;
    };

    // Acknowledge valid WhatsApp notifications. Message/order processing can
    // be added separately without exposing customer data in application logs.
    const changeCount = (payload.entry || []).reduce(
      (total, entry) => total + (entry.changes || []).length,
      0
    );

    return NextResponse.json({
      ok: true,
      received: true,
      object: payload.object || null,
      changes: changeCount,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
