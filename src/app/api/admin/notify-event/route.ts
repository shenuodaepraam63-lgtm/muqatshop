import { NextRequest, NextResponse } from "next/server";
import { notifyAdminNewAccount } from "@/lib/admin-notify";

/**
 * Optional signal after registration. Not an admin-authenticated mutation of
 * business data, but still rate-limited and schema-checked to reduce abuse.
 */
const recent = new Map<string, number>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const key = `${ip}:${Math.floor(now / WINDOW_MS)}`;
  const n = (recent.get(key) || 0) + 1;
  recent.set(key, n);
  if (recent.size > 500) {
    for (const k of recent.keys()) {
      if (!k.endsWith(String(Math.floor(now / WINDOW_MS)))) recent.delete(k);
    }
  }
  return n <= MAX_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (!rateLimit(ip)) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

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
      return NextResponse.json(
        { ok: false, error: "unsupported" },
        { status: 400 }
      );
    }

    const email = String(body.email || "").trim().toLowerCase();
    if (!email.includes("@") || email.length > 200) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    void notifyAdminNewAccount({
      email,
      fullName: body.fullName?.trim()?.slice(0, 120),
      accountType: body.accountType?.slice(0, 40),
      phone: body.phone?.trim()?.slice(0, 30),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
