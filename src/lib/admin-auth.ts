import { createClient, type User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

/**
 * Admin auth resolution — Phase 1.A
 *
 * Priority when RBAC tables exist:
 *  1) admin_staff row for user, status = active
 *  2) (transition) profiles.account_type = admin
 *  3) (transition) RPC is_platform_admin
 *  4) emergency allowlist ONLY when table missing OR bootstrap not completed
 *
 * When staff exists but is suspended/terminated → always deny (no allowlist bypass).
 * Profiles are NOT the long-term source of permissions.
 */

export type AdminAuthSuccess = {
  ok: true;
  user: User;
  email: string;
  source:
    | "admin_staff"
    | "profile_admin"
    | "rpc"
    | "allowlist_bootstrap"
    | "allowlist_legacy";
  staffId?: string;
  staffStatus?: string;
  rbacReady?: boolean;
};

export type AdminAuthFailure = {
  ok: false;
  status: 401 | 403 | 503;
  error: string;
  code: string;
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
  const set = new Set<string>();
  for (const part of raw.split(",")) {
    const e = part.trim().toLowerCase();
    if (e.includes("@")) set.add(e);
  }
  if (set.size === 0) {
    const legacy =
      process.env.LEGACY_ADMIN_EMAIL?.trim().toLowerCase() ||
      "muqatshop@gmail.com";
    if (legacy.includes("@")) set.add(legacy);
  }
  return set;
}

type StaffRow = {
  id: string;
  status: string;
  email: string | null;
  display_name: string | null;
};

async function loadStaffByUserId(
  userId: string
): Promise<{ row: StaffRow | null; tableMissing: boolean }> {
  try {
    const service = getSupabaseServiceClient();
    const { data, error } = await service
      .from("admin_staff")
      .select("id, status, email, display_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (
        msg.includes("does not exist") ||
        msg.includes("schema cache") ||
        error.code === "42P01" ||
        error.code === "PGRST205"
      ) {
        return { row: null, tableMissing: true };
      }
      return { row: null, tableMissing: false };
    }
    return { row: (data as StaffRow) || null, tableMissing: false };
  } catch {
    return { row: null, tableMissing: true };
  }
}

async function isBootstrapCompleted(): Promise<boolean | null> {
  try {
    const service = getSupabaseServiceClient();
    const { data, error } = await service
      .from("admin_bootstrap_state")
      .select("bootstrap_completed_at")
      .eq("id", 1)
      .maybeSingle();
    if (error) return null;
    return Boolean(data?.bootstrap_completed_at);
  } catch {
    return null;
  }
}

export async function resolveAdminFromRequest(
  request: Request
): Promise<AdminAuthResult> {
  const token = parseBearer(request);
  if (!token) {
    return { ok: false, status: 401, error: "غير مصرح", code: "NO_TOKEN" };
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

  const { row: staff, tableMissing } = await loadStaffByUserId(user.id);

  if (!tableMissing && staff) {
    if (staff.status !== "active") {
      return {
        ok: false,
        status: 403,
        error: "حساب الموظف موقوف أو منتهٍ",
        code: "STAFF_INACTIVE",
      };
    }
    return {
      ok: true,
      user,
      email,
      source: "admin_staff",
      staffId: staff.id,
      staffStatus: staff.status,
      rbacReady: true,
    };
  }

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
      return {
        ok: true,
        user,
        email,
        source: "profile_admin",
        rbacReady: !tableMissing,
      };
    }
  } catch {
    /* fall through */
  }

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
      return {
        ok: true,
        user,
        email,
        source: "rpc",
        rbacReady: !tableMissing,
      };
    }
  } catch {
    /* ignore */
  }

  if (tableMissing && email && allowlistEmails().has(email)) {
    return {
      ok: true,
      user,
      email,
      source: "allowlist_legacy",
      rbacReady: false,
    };
  }

  if (!tableMissing && !staff && email && allowlistEmails().has(email)) {
    const bootDone = await isBootstrapCompleted();
    if (bootDone !== true) {
      return {
        ok: true,
        user,
        email,
        source: "allowlist_bootstrap",
        rbacReady: true,
      };
    }
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

export async function resolveStaffPermissions(
  staffId: string
): Promise<string[]> {
  try {
    const service = getSupabaseServiceClient();

    const { data: roles } = await service
      .from("admin_staff_roles")
      .select("role_id, admin_roles(code, is_active)")
      .eq("staff_id", staffId);

    const roleIds: string[] = [];
    let isSuper = false;
    for (const row of roles || []) {
      const r = row as {
        role_id: string;
        admin_roles?:
          | { code: string; is_active: boolean }
          | { code: string; is_active: boolean }[]
          | null;
      };
      const roleObj = Array.isArray(r.admin_roles)
        ? r.admin_roles[0]
        : r.admin_roles;
      if (roleObj?.is_active === false) continue;
      if (roleObj?.code === "super_admin") isSuper = true;
      roleIds.push(r.role_id);
    }

    if (isSuper) {
      const { data: allPerms } = await service
        .from("admin_permissions")
        .select("code");
      return (allPerms || []).map((p: { code: string }) => p.code);
    }

    const codes = new Set<string>();
    if (roleIds.length > 0) {
      const { data: rp } = await service
        .from("admin_role_permissions")
        .select("permission_id, admin_permissions(code)")
        .in("role_id", roleIds);
      for (const row of rp || []) {
        const r = row as {
          admin_permissions?:
            | { code: string }
            | { code: string }[]
            | null;
        };
        const p = Array.isArray(r.admin_permissions)
          ? r.admin_permissions[0]
          : r.admin_permissions;
        if (p?.code) codes.add(p.code);
      }
    }

    const { data: overrides } = await service
      .from("admin_staff_permission_overrides")
      .select("effect, admin_permissions(code)")
      .eq("staff_id", staffId);

    for (const row of overrides || []) {
      const r = row as {
        effect: string;
        admin_permissions?:
          | { code: string }
          | { code: string }[]
          | null;
      };
      const p = Array.isArray(r.admin_permissions)
        ? r.admin_permissions[0]
        : r.admin_permissions;
      if (!p?.code) continue;
      if (r.effect === "deny") codes.delete(p.code);
      if (r.effect === "grant") codes.add(p.code);
    }

    return Array.from(codes).sort();
  } catch {
    return [];
  }
}
