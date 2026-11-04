# Security Hardening — Rollback Plan

## Scope
Branch: `security/hardening`  
Does **not** auto-apply SQL to Production.

## Code rollback
1. Revert merge / deploy previous Vercel deployment tied to `main`.
2. Or `git revert` the security commits on the branch before merge.

## SQL rollback (only if migration was applied)

### products
Re-creating old open policies is **not recommended**. Prefer:
```sql
-- Emergency: allow admin function write + public read active
-- (restore from policy dump taken before migration)
```
Always keep a `pg_policies` dump before applying.

### customers
Restore previous `customers_all` only as last resort and schedule immediate re-hardening.

### is_platform_admin
```sql
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT COALESCE(lower(auth.jwt() ->> 'email') = lower('muqatshop@gmail.com'), false);
$function$;
```

## Backup requirement
Before any Production SQL: Supabase dashboard backup or `pg_dump` of schema+policies.

## Functional smoke after rollback
- Home, product detail, add to cart, checkout create order
- Admin login, product list, order status change
- Cloudinary upload from admin only
