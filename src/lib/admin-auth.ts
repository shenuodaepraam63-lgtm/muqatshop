import { createClient, type User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

/**
 * Central server-side admin authorization.
 * Never trust client role, localStorage, or UI alone.
 *
 * Resolution order:
 * 1) profiles.account_type = 'admin' (canonical target)
 * 2) RPC is_platform_admin() when callable with user JWT
 * 3) ADMIN_EMAILS env allowlist (transition only — not final design)
 *
 * Service role is used only after user identity is proven via JWT.
 */

export type AdminAuthSuccess = {
  ok: true;
  user: User;
  email: string;
  source: "profile_admin" | "rpc" | "allowlist";
};

export type AdminAuthFailure = {
  ok: false;
  status: 401 | 403 | 503;
  error: string;
  code: "NO_TOKEN" | "INVALID_SESSION" | "NOT_ADMIN" | "SERVER_MISCONFIGURED";
};

export type AdminAuthResult = AdminAuthSuccess | AdminAuthFailure;

function parseBearer(request: Request): string {
  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return "";
}

function allowlistEmails(): Set<string> {
  const raw =
    process.env.ADMIN_EMAILS?.trim() ||
    process.env.PLATFORM_ADMIN_EMAILS?.trim() ||
    "";
  const set = new Set<
    string
  >();
  for (const part of raw.split(",")) {
    const e = part.trim().toLowerCase();
    if (e.includes("@")) set.add(e);
  }
  // Transition bridge only — prefer ADMIN_EMAILS in Vercel over hardcoding long-term.
  if (set.size === 0) {
    const legacy = process.env.LEGACY_ADMIN_EMAIL?.trim().toLowerCase();
    if (legacy?.includes("@")) set.add(legacy);
  }
  return set;
}

export async function resolveAdminFromRequest(
  request: Request
): Promise<AdminAuthResult> {
  const token = parseBearer(request);
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "غير مصرح",
      code: "NO_TOKEN",
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return {
      ok: false,
      status: 503,
      error: "إعدادات الخادم غير مكتملة",
      code: "SERVER_MISCONFIGURED",
    };
  }

  // Validate JWT with anon key (does not elevate privileges).
  const authClient = createClient(url, anon, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const {
    data: { user },
    error: userErr,
  } = await authClient.auth.getUser(token);

  if (userErr || !user?.id) {
    return {
      ok: false,
      status: 401,
      error: "جلسة غير صالحة",
      code: "INVALID_SESSION",
    };
  }

  const email = (user.email || "").trim().toLowerCase();

  // 1) Canonical: profiles.account_type
  try {
    const service = getSupabaseServiceClient();
    const { data: profile } = await service
      .from("profiles")
      .select("account_type, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (
      profile &&
      profile.is_active !== false &&
      String(profile.account_type || "").toLowerCase() === "admin"
    ) {
      return { ok: true, user, email, source: "profile_admin" };
    }
  } catch {
    // Service role missing in some local envs — fall through.
  }

  // 2) RPC with user JWT (uses DB function is_platform_admin)
  try {
    const userDb = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    const { data: rpcAdmin, error: rpcErr } = await userDb.rpc(
      "is_platform_admin"
    );
    if (!rpcErr && rpcAdmin === true) {
      return { ok: true, user, email, source: "rpc" };
    }
  } catch {
    /* ignore */
  }

  // 3) Transition allowlist from env (not final authority model)
  if (email && allowlistEmails().has(email)) {
    return { ok: true, user, email, source: "allowlist" };
  }

  return {
    ok: false,
    status: 403,
    error: "غير مصرح — صلاحية إدارية مطلوبة",
    code: "NOT_ADMIN",
  };
}

export async function requireAdmin(
  request: Request
): Promise<AdminAuthSuccess | NextResponse> {
  const result = await resolveAdminFromRequest(request);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, code: result.code },
      { status: result.status, headers: { "Cache-Control": "no-store" } }
    );
  }
  return result;
}

export function isAdminAuthSuccess(
  v: AdminAuthSuccess | NextResponse
): v is AdminAuthSuccess {
  return (v as AdminAuthSuccess).ok === true;
}
