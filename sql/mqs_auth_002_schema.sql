-- =============================================================================
-- MQS-AUTH-002 — Additive account schema (SAFE / NON-DESTRUCTIVE)
-- Document: Authentication & Account Experience
--
-- WHAT THIS DOES
--   • Creates: profiles, affiliate_profiles, supplier_profiles, account_activity
--   • Enables RLS + owner/admin policies on NEW tables only
--   • Optional soft-link columns on legacy customers / merchants (nullable)
--   • Optional backfill helpers (commented) — run only after review
--
-- WHAT THIS DOES NOT DO
--   • Does NOT drop customers, merchants, merchant_applications, or any data
--   • Does NOT change existing open RLS on legacy tables (separate phase)
--   • Does NOT delete sessions, passwords, or auth.users rows
--   • Does NOT replace OTP/email link flows
--
-- APPLY: review on Staging first, then run in a maintenance window if approved.
-- ROLLBACK: see bottom of this file.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0) Shared helpers (idempotent)
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

-- Platform admin check (matches current admin email used in orders policies).
-- SECURITY DEFINER so policies can call it; narrow GRANT.
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

-- ---------------------------------------------------------------------------
-- 1) profiles — one row per auth.users (canonical identity for MQS-AUTH-002)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  -- account_type is the ROLE; approval status lives on affiliate/supplier profiles
  account_type text NOT NULL DEFAULT 'customer'
    CHECK (account_type IN ('customer', 'affiliate', 'supplier', 'admin')),
  -- general account flag (not the same as affiliate/supplier approval)
  is_active boolean NOT NULL DEFAULT true,
  -- soft links to legacy rows (nullable; never required for new flow)
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

COMMENT ON TABLE public.profiles IS
  'MQS-AUTH-002 canonical user profile. Role = account_type. Do not let clients change admin.';
COMMENT ON COLUMN public.profiles.account_type IS
  'customer | affiliate | supplier | admin — NOT the same as approval status';

-- ---------------------------------------------------------------------------
-- 2) affiliate_profiles — marketers (Pending until admin approves)
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

COMMENT ON TABLE public.affiliate_profiles IS
  'Affiliate application + marketing meta. status gates marketing permissions.';

-- ---------------------------------------------------------------------------
-- 3) supplier_profiles — merchants/vendors (Pending until admin approves)
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

COMMENT ON TABLE public.supplier_profiles IS
  'Supplier/vendor application. Products only after status = approved (enforced in app/API).';

-- ---------------------------------------------------------------------------
-- 4) account_activity — audit trail (append-oriented)
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

COMMENT ON TABLE public.account_activity IS
  'Account events for support/audit. Clients may INSERT own events; cannot UPDATE/DELETE.';

-- ---------------------------------------------------------------------------
-- 5) Soft-link columns on LEGACY tables (nullable only — no data loss)
-- ---------------------------------------------------------------------------

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- FK only if not already present (ignore error if constraint exists with different name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'customers_auth_user_id_fkey'
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

-- Merchants: optional link to auth.users for unified login later
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'merchants_auth_user_id_fkey'
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
-- 6) Auto-create profile on new auth user (does not touch legacy rows)
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
  v_type := COALESCE(NEW.raw_user_meta_data ->> 'account_type', NEW.raw_user_meta_data ->> 'role', 'customer');
  IF v_type NOT IN ('customer', 'affiliate', 'supplier', 'admin') THEN
    v_type := 'customer';
  END IF;
  -- Never allow self-signup as admin via metadata
  IF v_type = 'admin' THEN
    v_type := 'customer';
  END IF;

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
-- 7) RLS on NEW tables only (legacy policies unchanged)
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_activity ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
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

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_platform_admin())
  WITH CHECK (
    -- non-admin cannot escalate to admin or change id
    id = auth.uid()
    AND (
      public.is_platform_admin()
      OR account_type IN ('customer', 'affiliate', 'supplier')
    )
  );

CREATE POLICY profiles_delete_admin ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_platform_admin());

-- affiliate_profiles
DROP POLICY IF EXISTS affiliate_select_own ON public.affiliate_profiles;
DROP POLICY IF EXISTS affiliate_insert_self ON public.affiliate_profiles;
DROP POLICY IF EXISTS affiliate_update_own_limited ON public.affiliate_profiles;
DROP POLICY IF EXISTS affiliate_update_admin ON public.affiliate_profiles;

CREATE POLICY affiliate_select_own ON public.affiliate_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY affiliate_insert_self ON public.affiliate_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
  );

-- User may update marketing fields only while pending/needs_information;
-- cannot set approved/suspended themselves.
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

-- supplier_profiles (same pattern)
DROP POLICY IF EXISTS supplier_select_own ON public.supplier_profiles;
DROP POLICY IF EXISTS supplier_insert_self ON public.supplier_profiles;
DROP POLICY IF EXISTS supplier_update_own_limited ON public.supplier_profiles;
DROP POLICY IF EXISTS supplier_update_admin ON public.supplier_profiles;

CREATE POLICY supplier_select_own ON public.supplier_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY supplier_insert_self ON public.supplier_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
  );

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

-- account_activity
DROP POLICY IF EXISTS activity_select_own ON public.account_activity;
DROP POLICY IF EXISTS activity_insert_self ON public.account_activity;

CREATE POLICY activity_select_own ON public.account_activity
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY activity_insert_self ON public.account_activity
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_platform_admin());

-- No UPDATE/DELETE policies for activity → append-only for clients

COMMIT;

-- =============================================================================
-- OPTIONAL BACKFILL (run separately after reviewing SELECT results)
-- Does not delete; only fills null links and creates missing profiles.
-- =============================================================================

/*
-- Preview matches by email (read-only):
SELECT c.id AS customer_id, c.email, u.id AS auth_user_id
FROM public.customers c
JOIN auth.users u ON lower(u.email) = lower(c.email)
WHERE c.auth_user_id IS NULL;

SELECT m.id AS merchant_id, m.email, u.id AS auth_user_id
FROM public.merchants m
JOIN auth.users u ON lower(u.email) = lower(m.email)
WHERE m.auth_user_id IS NULL;

-- Backfill auth_user_id on customers:
UPDATE public.customers c
SET auth_user_id = u.id
FROM auth.users u
WHERE c.auth_user_id IS NULL
  AND lower(c.email) = lower(u.email);

-- Backfill auth_user_id on merchants:
UPDATE public.merchants m
SET auth_user_id = u.id
FROM auth.users u
WHERE m.auth_user_id IS NULL
  AND lower(m.email) = lower(u.email);

-- Create profiles for existing auth users (skip if already present):
INSERT INTO public.profiles (id, full_name, phone, account_type, legacy_customer_id, legacy_merchant_id)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1)),
  NULLIF(u.raw_user_meta_data ->> 'phone', ''),
  CASE
    WHEN lower(COALESCE(u.raw_user_meta_data ->> 'role', '')) = 'merchant' THEN 'affiliate'
    ELSE 'customer'
  END,
  c.id,
  m.id
FROM auth.users u
LEFT JOIN public.customers c ON c.auth_user_id = u.id OR lower(c.email) = lower(u.email)
LEFT JOIN public.merchants m ON m.auth_user_id = u.id OR lower(m.email) = lower(u.email)
ON CONFLICT (id) DO NOTHING;
*/

-- =============================================================================
-- ROLLBACK (new objects only — does not touch legacy data)
-- =============================================================================

/*
BEGIN;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

DROP TABLE IF EXISTS public.account_activity CASCADE;
DROP TABLE IF EXISTS public.supplier_profiles CASCADE;
DROP TABLE IF EXISTS public.affiliate_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Optional: remove soft-link columns (only if you are sure nothing uses them)
-- ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_auth_user_id_fkey;
-- ALTER TABLE public.customers DROP COLUMN IF EXISTS auth_user_id;
-- ALTER TABLE public.merchants DROP CONSTRAINT IF EXISTS merchants_auth_user_id_fkey;
-- ALTER TABLE public.merchants DROP COLUMN IF EXISTS auth_user_id;

-- Keep is_platform_admin / set_updated_at if other objects use them; else:
-- DROP FUNCTION IF EXISTS public.is_platform_admin();
-- DROP FUNCTION IF EXISTS public.set_updated_at();

COMMIT;
*/
