# Security Hardening Status (branch security/hardening)

## Done on branch (not Production)
- [x] `src/lib/admin-auth.ts` — central server requireAdmin
- [x] Cloudinary sign requires admin
- [x] Admin homepage-settings uses requireAdmin
- [x] Order status POST hard-gated (no soft allow)
- [x] `/api/admin/products` GET/POST + `[id]` PATCH/DELETE (service role after auth)
- [x] notify-event rate limit
- [x] SQL migrations prepared under `supabase/migrations/` (NOT applied)
- [x] Rollback doc

## Not done (requires Production approval)
- [ ] Apply SQL migrations
- [ ] Set `profiles.account_type = 'admin'` for operator accounts
- [ ] Set `ADMIN_EMAILS` / remove email bridge from `is_platform_admin`
- [ ] Migrate admin UI product writes from direct Supabase client to `/api/admin/products`
- [ ] Middleware (optional extra layer)
- [ ] Merge to main / Vercel deploy
- [ ] Key rotation

## Tests run in this preparation
- Static module contract test file added; full suite needs `npx tsx --test` in CI with deps.
- No live exploit tests against Production data.
