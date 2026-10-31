import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getWhatsAppConfig } from "@/lib/whatsapp/config";
import { handleInboundWhatsAppMessages } from "@/lib/whatsapp/handle-inbound";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const cfg = getWhatsAppConfig();
  const verifyToken = cfg?.verifyToken || process.env.WHATSAPP_VERIFY_TOKEN;

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

export async function POST(req: NextRequest) {
  const appSecret =
    process.env.META_APP_SECRET?.trim() || getWhatsAppConfig()?.appSecret;

  if (!appSecret) {
    return NextResponse.json(
      { ok: false, error: "not_configured" },
      { status: 500 }
    );
  }

  const signature = req.headers.get("x-hub-signature-256") || "";
  const rawBody = await req.text();
  const expectedSignature =
    "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");

  try {
    const supplied = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    ) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as {
      object?: string;
      entry?: Array<{
        changes?: Array<{
          field?: string;
          value?: {
            messages?: unknown[];
            statuses?: unknown[];
          };
        }>;
      }>;
    };

    if (payload.object !== "whatsapp_business_account") {
      return NextResponse.json({ ok: true });
    }

    const messages: unknown[] = [];
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue;
        const batch = change.value?.messages;
        if (Array.isArray(batch)) messages.push(...batch);
      }
    }

    // Acknowledge quickly; process after response is not possible in serverless
    // without background — keep processing short and safe.
    if (messages.length) {
      await handleInboundWhatsAppMessages(
        messages as Parameters<typeof handleInboundWhatsAppMessages>[0]
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
