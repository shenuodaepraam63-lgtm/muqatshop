# Admin RBAC — Phase 1.A

**Branch:** `feat/admin-rbac-1a`  
**Status:** Code in repo only — migration NOT applied to Production  
**Do not merge to main / do not deploy without explicit approval**

## Files added/changed

| File | Purpose |
|------|--------|
| `supabase/migrations/20261105_admin_rbac_foundation.sql` | Tables, seeds, helpers, RLS on RBAC tables only |
| `src/lib/admin-auth.ts` | Dual-path resolution (staff → profile → rpc → allowlist rules) |
| `src/app/api/admin/me/route.ts` | Server identity endpoint for future UI |
| `docs/admin-rbac-phase-1a.md` | This runbook |

## Bootstrap (one-time)

Table `admin_bootstrap_state` (single row id=1):

- `bootstrap_completed_at IS NULL` → first Super Admin may be created via **manual SQL (service role)** or a future locked API, then set timestamp.
- After `bootstrap_completed_at` is set, allowlist alone must **not** open unlimited bootstrap for any empty staff list.

### Manual emergency recovery (ops only)

1. Identify `auth.users.id` for the operator account in Supabase Dashboard.
2. With service role SQL (ops only):
   - INSERT/UPDATE `admin_staff` status=active for that user_id
   - Link role `super_admin` via `admin_staff_roles`
   - SET `admin_bootstrap_state.bootstrap_completed_at = now()`
3. Never put service role key in the browser or client bundle.

## Transition behavior (before migration applied)

- `admin_staff` table missing → `requireAdmin` behaves like legacy allowlist / profile / rpc (source `allowlist_legacy` etc.).
- UI layouts still use hardcoded email until Phase 2 — **unchanged in 1.A** to avoid lockout.

## Tests (manual checklist — not run against Production in 1.A)

| # | Case | Expected |
|---|------|----------|
| T1 | Customer JWT → `GET /api/admin/me` | 401/403 |
| T2 | Customer JWT → `GET /api/admin/analytics/visitors` | 401/403 |
| T3 | Current admin JWT (allowlist) before migration | 200 (legacy path) |
| T4 | Active staff JWT after migration + staff row | 200, source `admin_staff` |
| T5 | Suspended staff JWT | 403 `STAFF_INACTIVE` |
| T6 | Terminated staff JWT | 403 `STAFF_INACTIVE` |
| T7 | Failed admin check does not call signOut on customer session | Client must not signOut store user when probing admin APIs |
| T8 | Bundle / network: no `service_role` key in client | Inspect env + network |
| T9 | Existing admin can still open `/admin` (layout still email-based) | No regression until Phase 2 |

## Explicit non-goals of 1.A

- No Production SQL apply
- No merge to main
- No layout email removal
- No RLS changes on orders/products/customers
- No AdminM merge

## Residual risks

1. Until migration is applied, RBAC tables unused — dual path keeps legacy access.
2. UI still trusts email constant — server APIs are the hardened path for new endpoints.
3. Nested select shape for `admin_roles` depends on Supabase FK hints; if empty permissions, check relationship names.
4. `is_platform_admin` replacement in SQL only takes effect after migration apply.
