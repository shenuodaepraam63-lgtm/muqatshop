import { NextResponse } from "next/server";
import {
  isAdminAuthSuccess,
  requireAdmin,
  resolveStaffPermissions,
} from "@/lib/admin-auth";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * GET /api/admin/me
 * Returns current admin identity for UI gating (server-validated).
 * Does not expose service role. Safe for authenticated admin session only.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!isAdminAuthSuccess(auth)) return auth;

  let permissions: string[] = [];
  let roles: string[] = [];
  let staff: {
    id: string;
    status: string;
    display_name: string | null;
    email: string | null;
  } | null = null;

  if (auth.staffId) {
    try {
      const service = getSupabaseServiceClient();
      const { data: staffRow } = await service
        .from("admin_staff")
        .select("id, status, display_name, email")
        .eq("id", auth.staffId)
        .maybeSingle();

      if (staffRow) {
        staff = staffRow as typeof staff;
      }

      const { data: roleRows } = await service
        .from("admin_staff_roles")
        .select("admin_roles(code)")
        .eq("staff_id", auth.staffId);

      for (const row of roleRows || []) {
        const r = row as {
          admin_roles?: { code: string } | { code: string }[] | null;
        };
        const roleObj = Array.isArray(r.admin_roles)
          ? r.admin_roles[0]
          : r.admin_roles;
        if (roleObj?.code) roles.push(roleObj.code);
      }

      permissions = await resolveStaffPermissions(auth.staffId);
    } catch {
      permissions = [];
      roles = [];
    }
  }

  // Transition sources without staff row: empty permissions list;
  // UI must not treat empty as "deny all store pages" until RBAC is enforced in layouts.
  const transition =
    auth.source === "profile_admin" ||
    auth.source === "rpc" ||
    auth.source === "allowlist_legacy" ||
    auth.source === "allowlist_bootstrap";

  return NextResponse.json(
    {
      ok: true,
      user: {
        id: auth.user.id,
        email: auth.email,
      },
      source: auth.source,
      rbacReady: auth.rbacReady === true,
      transition,
      staff,
      roles,
      permissions,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
