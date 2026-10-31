-- =============================================================================
-- MQS-AUTH-002 — Additive account schema v2 (SAFE / NON-DESTRUCTIVE)
-- Compatible with existing customers / merchants / merchant_applications
--
-- WHAT THIS DOES
--   • Creates: profiles, affiliate_profiles, supplier_profiles, account_activity
--   • RLS on NEW tables only (legacy open policies unchanged)
--   • Soft-link columns on legacy tables (nullable)
--   • P0/P1: admin can manage others; users cannot escalate role/status;
--            maps role=merchant → affiliate; protects admin-only columns
--
-- WHAT THIS DOES NOT DO
--   • Does NOT drop or rewrite legacy tables/data
--   • Does NOT tighten RLS on customers/merchants (later phase)
--   • Does NOT delete sessions, passwords, or auth.users
--
-- APPLY: Development Branch / Staging only until explicit Production approval.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0) Shared helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    lower(auth.jwt() ->> 'email') = lower('muqatshop@gmail.com'),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

-- Normalize signup metadata → account_type (legacy uses role=merchant)
CREATE OR REPLACE FUNCTION public.normalize_account_type(raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(trim(COALESCE(raw, '')))
    WHEN 'admin' THEN 'customer'  -- never self-assign admin
    WHEN 'affiliate' THEN 'affiliate'
    WHEN 'merchant' THEN 'affiliate'
    WHEN 'marketer' THEN 'affiliate'
    WHEN 'supplier' THEN 'supplier'
    WHEN 'vendor' THEN 'supplier'
    WHEN 'customer' THEN 'customer'
    WHEN 'user' THEN 'customer'
    ELSE 'customer'
  END;
$$;

-- ---------------------------------------------------------------------------
-- 1) profiles
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  account_type text NOT NULL DEFAULT 'customer'
    CHECK (account_type IN ('customer', 'affiliate', 'supplier', 'admin')),
  is_active boolean NOT NULL DEFAULT true,
  legacy_customer_id uuid REFERENCES public.customers (id) ON DELETE SET NULL,
  legacy_merchant_id uuid REFERENCES public.merchants (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_account_type_idx ON public.profiles (account_type);
CREATE INDEX IF NOT EXISTS profiles_legacy_customer_idx ON public.profiles (legacy_customer_id)
  WHERE legacy_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_legacy_merchant_idx ON public.profiles (legacy_merchant_id)
  WHERE legacy_merchant_id IS NOT NULL;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- P0/P1: non-admin cannot change account_type or is_active
CREATE OR REPLACE FUNCTION public.profiles_guard_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_platform_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.account_type IS DISTINCT FROM OLD.account_type THEN
    RAISE EXCEPTION 'account_type can only be changed by platform admin';
  END IF;
  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'is_active can only be changed by platform admin';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'profile id is immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_role_change ON public.profiles;
CREATE TRIGGER profiles_guard_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_role_change();

COMMENT ON TABLE public.profiles IS
  'MQS-AUTH-002 canonical profile. account_type is role; approval is on affiliate/supplier.';

-- ---------------------------------------------------------------------------
-- 2) affiliate_profiles
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'needs_information')),
  marketing_channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  marketing_url text,
  marketing_description text,
  application_note text,
  admin_note text,
  application_date timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_profiles_status_idx
  ON public.affiliate_profiles (status);

DROP TRIGGER IF EXISTS affiliate_profiles_set_updated_at ON public.affiliate_profiles;
CREATE TRIGGER affiliate_profiles_set_updated_at
  BEFORE UPDATE ON public.affiliate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- P1: protect admin columns + status escalation for non-admin
CREATE OR REPLACE FUNCTION public.affiliate_guard_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_platform_admin() THEN
    RETURN NEW;
  END IF;
  NEW.admin_note := OLD.admin_note;
  NEW.approved_at := OLD.approved_at;
  NEW.reviewed_at := OLD.reviewed_at;
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('pending', 'needs_information') THEN
    RAISE EXCEPTION 'affiliates cannot set status to %', NEW.status;
  END IF;
  IF OLD.status NOT IN ('pending', 'needs_information') THEN
    RAISE EXCEPTION 'affiliate application is locked for non-admin edits';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS affiliate_guard_admin_fields ON public.affiliate_profiles;
CREATE TRIGGER affiliate_guard_admin_fields
  BEFORE UPDATE ON public.affiliate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.affiliate_guard_admin_fields();

-- ---------------------------------------------------------------------------
-- 3) supplier_profiles
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.supplier_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_type text,
  category_id uuid REFERENCES public.categories (id) ON DELETE SET NULL,
  governorate text,
  description text,
  business_url text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'needs_information')),
  application_note text,
  admin_note text,
  application_date timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS supplier_profiles_status_idx
  ON public.supplier_profiles (status);
CREATE INDEX IF NOT EXISTS supplier_profiles_category_idx
  ON public.supplier_profiles (category_id)
  WHERE category_id IS NOT NULL;

DROP TRIGGER IF EXISTS supplier_profiles_set_updated_at ON public.supplier_profiles;
CREATE TRIGGER supplier_profiles_set_updated_at
  BEFORE UPDATE ON public.supplier_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.supplier_guard_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_platform_admin() THEN
    RETURN NEW;
  END IF;
  NEW.admin_note := OLD.admin_note;
  NEW.approved_at := OLD.approved_at;
  NEW.reviewed_at := OLD.reviewed_at;
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('pending', 'needs_information') THEN
    RAISE EXCEPTION 'suppliers cannot set status to %', NEW.status;
  END IF;
  IF OLD.status NOT IN ('pending', 'needs_information') THEN
    RAISE EXCEPTION 'supplier application is locked for non-admin edits';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS supplier_guard_admin_fields ON public.supplier_profiles;
CREATE TRIGGER supplier_guard_admin_fields
  BEFORE UPDATE ON public.supplier_profiles
  FOR EACH ROW EXECUTE FUNCTION public.supplier_guard_admin_fields();

-- ---------------------------------------------------------------------------
-- 4) account_activity
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.account_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS account_activity_user_idx
  ON public.account_activity (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS account_activity_type_idx
  ON public.account_activity (event_type);

-- ---------------------------------------------------------------------------
-- 5) Soft links on legacy tables (no data loss)
-- ---------------------------------------------------------------------------

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_auth_user_id_fkey'
  ) THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT customers_auth_user_id_fkey
      FOREIGN KEY (auth_user_id) REFERENCES auth.users (id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS customers_auth_user_id_uidx
  ON public.customers (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'merchants_auth_user_id_fkey'
  ) THEN
    ALTER TABLE public.merchants
      ADD CONSTRAINT merchants_auth_user_id_fkey
      FOREIGN KEY (auth_user_id) REFERENCES auth.users (id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS merchants_auth_user_id_uidx
  ON public.merchants (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 6) Auto profile on auth signup (maps merchant → affiliate)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type text;
  v_name text;
BEGIN
  v_type := public.normalize_account_type(
    COALESCE(
      NEW.raw_user_meta_data ->> 'account_type',
      NEW.raw_user_meta_data ->> 'role',
      'customer'
    )
  );

  v_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(COALESCE(NEW.email, ''), '@', 1)
  );

  INSERT INTO public.profiles (id, full_name, phone, account_type)
  VALUES (
    NEW.id,
    v_name,
    NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
    v_type
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- 7) RLS — new tables only
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_activity ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_delete_admin ON public.profiles;

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_platform_admin());

CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND account_type IN ('customer', 'affiliate', 'supplier')
  );

-- P0: split self vs admin update (admin can update other users)
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND account_type IN ('customer', 'affiliate', 'supplier')
  );

CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY profiles_delete_admin ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_platform_admin());

-- affiliate
DROP POLICY IF EXISTS affiliate_select_own ON public.affiliate_profiles;
DROP POLICY IF EXISTS affiliate_insert_self ON public.affiliate_profiles;
DROP POLICY IF EXISTS affiliate_update_own_limited ON public.affiliate_profiles;
DROP POLICY IF EXISTS affiliate_update_admin ON public.affiliate_profiles;

CREATE POLICY affiliate_select_own ON public.affiliate_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY affiliate_insert_self ON public.affiliate_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY affiliate_update_own_limited ON public.affiliate_profiles
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND status IN ('pending', 'needs_information')
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status IN ('pending', 'needs_information')
  );

CREATE POLICY affiliate_update_admin ON public.affiliate_profiles
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- supplier
DROP POLICY IF EXISTS supplier_select_own ON public.supplier_profiles;
DROP POLICY IF EXISTS supplier_insert_self ON public.supplier_profiles;
DROP POLICY IF EXISTS supplier_update_own_limited ON public.supplier_profiles;
DROP POLICY IF EXISTS supplier_update_admin ON public.supplier_profiles;

CREATE POLICY supplier_select_own ON public.supplier_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY supplier_insert_self ON public.supplier_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY supplier_update_own_limited ON public.supplier_profiles
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND status IN ('pending', 'needs_information')
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status IN ('pending', 'needs_information')
  );

CREATE POLICY supplier_update_admin ON public.supplier_profiles
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- activity
DROP POLICY IF EXISTS activity_select_own ON public.account_activity;
DROP POLICY IF EXISTS activity_insert_self ON public.account_activity;

CREATE POLICY activity_select_own ON public.account_activity
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY activity_insert_self ON public.account_activity
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_platform_admin());

COMMIT;

-- =============================================================================
-- OPTIONAL BACKFILL (commented — read-only preview first; never auto-run)
-- =============================================================================
/*
SELECT c.id, c.email, u.id AS auth_user_id
FROM public.customers c
JOIN auth.users u ON lower(u.email) = lower(c.email)
WHERE c.auth_user_id IS NULL;

SELECT m.id, m.email, u.id AS auth_user_id
FROM public.merchants m
JOIN auth.users u ON lower(u.email) = lower(m.email)
WHERE m.auth_user_id IS NULL;
*/

-- =============================================================================
-- ROLLBACK (new objects only)
-- =============================================================================
/*
BEGIN;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();
DROP TABLE IF EXISTS public.account_activity CASCADE;
DROP TABLE IF EXISTS public.supplier_profiles CASCADE;
DROP TABLE IF EXISTS public.affiliate_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.profiles_guard_role_change();
DROP FUNCTION IF EXISTS public.affiliate_guard_admin_fields();
DROP FUNCTION IF EXISTS public.supplier_guard_admin_fields();
DROP FUNCTION IF EXISTS public.normalize_account_type(text);
-- DROP FUNCTION IF EXISTS public.is_platform_admin();
COMMIT;
*/
