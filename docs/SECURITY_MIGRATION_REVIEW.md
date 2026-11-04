# SQL Migration Line Review (NOT applied on Production)

Files:
- `supabase/migrations/20261104_security_rls_products_customers.sql`
- `supabase/migrations/20261104_security_is_platform_admin_v2.sql`

## products — DROP
| Policy | Why drop |
|--------|----------|
| Allow delete products | USING true |
| Allow insert products | WITH CHECK true |
| Allow update products | USING true |
| Public read active products | `(is_active = true) OR true` ≈ always true |

## products — CREATE
| Policy | Roles | Op | USING / CHECK |
|--------|-------|-----|----------------|
| products_select_active | anon, authenticated | SELECT | `is_active = true` |
| products_admin_all | authenticated | ALL | `is_platform_admin()` both sides |

Notes:
- Service role (server APIs) bypasses RLS — `/api/admin/products` remains after tighten.
- Catalog public read still works for active products only.
- Inactive products hidden from anon/customer clients (admin API still sees them).

## customers — DROP
| Policy | Why |
|--------|-----|
| customers_all | ALL with true |

## customers — CREATE
| Policy | Op | USING / CHECK |
|--------|-----|----------------|
| customers_select_own | SELECT | admin OR auth_user_id = uid OR (legacy null auth_user_id + email match) |
| customers_update_own | UPDATE | admin OR auth_user_id = uid (no email-only update) |
| customers_insert_self | INSERT | admin OR auth_user_id = uid |
| customers_delete_admin | DELETE | admin only |

## is_platform_admin v2
- Primary: `profiles.account_type = 'admin'` AND active
- Bridge: fixed email still OR’d (remove after all admins have account_type)
- SECURITY DEFINER + search_path=public
- Client cannot set account_type=admin: existing `profiles_guard_role_change` + update policies

## Conflict risks
- Multiple permissive policies OR together — intentional for admin+own.
- If admin panel still used browser client for products without JWT admin RPC, writes fail after migration — mitigated by `/api/admin/products`.

## Rollback
See `docs/SECURITY_ROLLBACK.md`. Prefer restore from pre-migration `pg_policies` dump over recreating open policies.
