import { createClient, type User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

/**
 * Admin auth — Phase 1.A hardened
 * After RBAC tables exist: active admin_staff only.
 * Legacy profile/rpc/allowlist: only when admin_staff table is missing.
 * Unexpected DB errors → 503 (fail closed).
 * Super Admin: all perms; deny overrides ignored (matches SQL).
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

type StaffLookup =
  | { kind: "missing_table" }
  | { kind: "error"; code?: string }
  | { kind: "ok"; row: StaffRow | null };

type BootstrapLookup =
  | { kind: "missing_table" }
  | { kind: "error"; code?: string }
  | { kind: "ok"; completed: boolean };

function isUndefinedTableError(error: {
  message?: string;
  code?: string;
}): boolean {
  const msg = (error.message || "").toLowerCase();
  const code = String(error.code || "");
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find the table")
  );
}

async function loadStaffByUserId(userId: string): Promise<StaffLookup> {
  try {
    const service = getSupabaseServiceClient();
    const { data, error } = await service
      .from("admin_staff")
      .select("id, status, email, display_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (isUndefinedTableError(error)) return { kind: "missing_table" };
      return { kind: "error", code: error.code };
    }
    return { row: (data as StaffRow) || null, kind: "ok" };
  } catch {
    return { kind: "error", code: "STAFF_LOOKUP_EXCEPTION" };
  }
}

async function loadBootstrapState(): Promise<BootstrapLookup> {
  try {
    const service = getSupabaseServiceClient();
    const { data, error } = await service
      .from("admin_bootstrap_state")
      .select("bootstrap_completed_at")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      if (isUndefinedTableError(error)) return { kind: "missing_table" };
      return { kind: "error", code: error.code };
    }
    return {
      kind: "ok",
      completed: Boolean(data?.bootstrap_completed_at),
    };
  } catch {
    return { kind: "error", code: "BOOTSTRAP_LOOKUP_EXCEPTION" };
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
  const staffLookup = await loadStaffByUserId(user.id);

  if (staffLookup.kind === "error") {
    return {
      ok: false,
      status: 503,
      error: "تعذر التحقق من صلاحيات الإدارة",
      code: "STAFF_LOOKUP_FAILED",
    };
  }

  if (staffLookup.kind === "ok") {
    if (staffLookup.row) {
      if (staffLookup.row.status !== "active") {
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
        staffId: staffLookup.row.id,
        staffStatus: staffLookup.row.status,
        rbacReady: true,
      };
    }

    const boot = await loadBootstrapState();
    if (boot.kind === "error") {
      return {
        ok: false,
        status: 503,
        error: "تعذر قراءة حالة تهيئة الإدارة",
        code: "BOOTSTRAP_LOOKUP_FAILED",
      };
    }
    if (boot.kind === "missing_table") {
      return {
        ok: false,
        status: 503,
        error: "تهيئة RBAC غير مكتملة",
        code: "RBAC_INCOMPLETE",
      };
    }

    if (!boot.completed && email && allowlistEmails().has(email)) {
      return {
        ok: true,
        user,
        email,
        source: "allowlist_bootstrap",
        rbacReady: true,
      };
    }

    return {
      ok: false,
      status: 403,
      error: "غير مصرح — يلزم سجل موظف إداري نشط",
      code: "NOT_ADMIN_STAFF",
    };
  }

  // admin_staff table missing — legacy paths only
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
        rbacReady: false,
      };
    }
  } catch {
    /* try other legacy */
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
        rbacReady: false,
      };
    }
  } catch {
    /* ignore */
  }

  if (email && allowlistEmails().has(email)) {
    return {
      ok: true,
      user,
      email,
      source: "allowlist_legacy",
      rbacReady: false,
    };
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

/** Aligned with public.admin_has_permission */
export async function resolveStaffPermissions(
  staffId: string
): Promise<string[]> {
  try {
    const service = getSupabaseServiceClient();

    const { data: roles, error: rolesErr } = await service
      .from("admin_staff_roles")
      .select("role_id, admin_roles(code, is_active)")
      .eq("staff_id", staffId);

    if (rolesErr) return [];

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
      return (allPerms || [])
        .map((p: { code: string }) => p.code)
        .sort();
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
      if (r.effect === "grant") codes.add(p.code);
    }
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
    }

    return Array.from(codes).sort();
  } catch {
    return [];
  }
}
