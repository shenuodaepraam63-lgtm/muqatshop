-- MUQATSHOP Security Hardening — products & customers RLS
-- STATUS: PREPARED ONLY — DO NOT APPLY TO PRODUCTION WITHOUT EXPLICIT APPROVAL
-- Prerequisite: Admin product mutations go through /api/admin/products with service role
--               after requireAdmin(). Admin panel client-side direct writes must be migrated.
-- Rollback: see docs/SECURITY_ROLLBACK.md

BEGIN;

-- ---------------------------------------------------------------------------
-- products: drop open policies; public read active only; admin write via is_platform_admin()
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow delete products" ON public.products;
DROP POLICY IF EXISTS "Allow insert products" ON public.products;
DROP POLICY IF EXISTS "Allow update products" ON public.products;
DROP POLICY IF EXISTS "Public read active products" ON public.products;

-- Public / authenticated: active catalog only
CREATE POLICY products_select_active
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Platform admin (function): full access for residual client paths during transition
CREATE POLICY products_admin_all
  ON public.products
  FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- customers: replace open ALL
-- Ownership uses auth_user_id when set; email match is secondary and only when
-- auth_user_id is null (legacy rows). Prefer linking auth_user_id going forward.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS customers_all ON public.customers;

CREATE POLICY customers_select_own
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (
    public.is_platform_admin()
    OR auth_user_id = auth.uid()
    OR (
      auth_user_id IS NULL
      AND email IS NOT NULL
      AND lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

CREATE POLICY customers_update_own
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (
    public.is_platform_admin()
    OR auth_user_id = auth.uid()
  )
  WITH CHECK (
    public.is_platform_admin()
    OR auth_user_id = auth.uid()
  );

CREATE POLICY customers_insert_self
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR auth_user_id = auth.uid()
  );

-- No DELETE for non-admin customers table via client
CREATE POLICY customers_delete_admin
  ON public.customers
  FOR DELETE
  TO authenticated
  USING (public.is_platform_admin());

COMMIT;
