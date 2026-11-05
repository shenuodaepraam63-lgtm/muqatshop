# Production Readiness Package — security/hardening

**Status:** Prepared only. Do NOT apply to Production without explicit owner approval.

## 1. Migration order (Test first)

1. `supabase/migrations/20261104_security_is_platform_admin_v2.sql`
2. `supabase/migrations/20261104_security_rls_products_customers.sql`
3. Any follow-up RLS for orders/wallets after UI writes are fully server-side

## 2. Admin account setup

- Prefer `profiles.account_type = 'admin'` and `is_active = true`
- Optional bridge: `ADMIN_EMAILS` env (comma-separated) — temporary only
- Do not rely on email alone long-term

## 3. Required environment variables (names only)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `ADMIN_EMAILS` (optional bridge)
- `NOTIFY_EVENT_SECRET` (optional; server-to-server only, never NEXT_PUBLIC)
- Cloudinary server keys as already used by `/api/cloudinary/sign`

## 4. Supabase settings checklist

- Auth JWT verification works with anon client `getUser`
- RLS enabled on sensitive tables before tightening policies
- Service role never exposed to browser

## 5. Backup & restore

- Take Supabase backup / point-in-time before any Production migration
- Verify restore procedure on Test project first

## 6. Rollback

- See `docs/SECURITY_ROLLBACK.md`
- Prefer revert policies over DROP tables
- Code rollback: deploy previous main commit

## 7. Deploy order (when approved)

1. Deploy code from security/hardening (or merge) so server APIs exist
2. Smoke-test admin login and product/order APIs
3. Apply migrations on Production in order
4. Re-test admin writes and customer checkout
5. Monitor error logs 24h

## 8. Post-deploy verification

- Anonymous cannot call `/api/admin/*`
- Customer cannot change order status
- Active admin can manage products/categories
- Checkout creates order via `/api/orders/create` with DB prices
- Merchant withdraw approve/reject via `/api/admin/merchant-ops`

## 9. Residual risks until Test Project + full RLS

- In-memory OTP rate limit (not multi-instance durable)
- `src/lib/merchant.ts` client helpers still can write if called from merchant UI under open RLS
- WhatsApp webhook signature verification must be confirmed against live secrets
- Integration tests need dedicated Test Project credentials
