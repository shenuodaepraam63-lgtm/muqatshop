import { NextRequest, NextResponse } from "next/server";
import { notifyAdminNewAccount } from "@/lib/admin-notify";

/**
 * Fire-and-forget from client after successful registration.
 * No secrets returned. Rate-limited lightly by design (no auth required;
 * only stores a notification — not user-facing data mutation).
 */
export async function POST(req: NextRequest) {
  try {
    let body: {
      type?: string;
      email?: string;
      fullName?: string;
      accountType?: string;
      phone?: string;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    if (body.type !== "new_account") {
      return NextResponse.json({ ok: false, error: "unsupported" }, { status: 400 });
    }

    const email = String(body.email || "").trim().toLowerCase();
    if (!email.includes("@")) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Don't await external WhatsApp for too long
    void notifyAdminNewAccount({
      email,
      fullName: body.fullName?.trim(),
      accountType: body.accountType,
      phone: body.phone,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
