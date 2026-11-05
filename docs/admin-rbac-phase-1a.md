# Admin RBAC Phase 1.A — hardened

Branch: `feat/admin-rbac-1a`

## Policy summary

| Situation | Access |
|-----------|--------|
| `admin_staff` table missing | Legacy: profile admin → RPC → allowlist |
| Tables exist + active staff | **Only** source of truth |
| Tables exist + no staff + bootstrap incomplete | Allowlist only |
| Tables exist + bootstrap complete + no staff | **Deny** (profile cannot grant) |
| Staff lookup / bootstrap query error | **503** fail-closed |
| Suspended / terminated staff | **403** always |

## Permissions (SQL `admin_has_permission` = TS `resolveStaffPermissions`)

1. Super Admin role (active) → all permissions; **deny overrides ignored**
2. Otherwise: deny override → false; grant override → true; else role permissions

## Bootstrap

- Function: `admin_bootstrap_super_admin(user_id, email, display_name, notes)`
- `pg_advisory_xact_lock` + row `FOR UPDATE` on `admin_bootstrap_state`
- **EXECUTE** granted to `service_role` only
- Second call → `BOOTSTRAP_ALREADY_COMPLETED`
- Emergency recovery: `sql/admin_rbac_emergency_recovery.sql` (ops manual)

## FK

- `admin_staff.user_id` → `auth.users(id)` **ON DELETE RESTRICT**

## Explicit non-goals

- No Production SQL apply
- No merge to main
- No layout email removal in 1.A
