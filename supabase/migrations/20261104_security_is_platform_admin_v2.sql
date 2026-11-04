-- MUQATSHOP — gradual is_platform_admin centralization
-- STATUS: PREPARED ONLY — DO NOT APPLY TO PRODUCTION WITHOUT APPROVAL
--
-- Target: prefer profiles.account_type = 'admin'
-- Bridge: keep email allowlist inside the function until all admin users have
--         account_type = 'admin' and ADMIN_EMAILS is empty.
-- Client cannot self-promote: profiles_guard_role_change + update policies.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (
      SELECT p.account_type = 'admin' AND COALESCE(p.is_active, true)
      FROM public.profiles p
      WHERE p.id = auth.uid()
      LIMIT 1
    ),
    false
  )
  OR COALESCE(
    lower(auth.jwt() ->> 'email') = lower('muqatshop@gmail.com'),
    false
  );
$function$;

COMMENT ON FUNCTION public.is_platform_admin() IS
  'Admin check: profiles.account_type=admin OR transitional email bridge. Remove email bridge after all admins have account_type.';

COMMIT;
