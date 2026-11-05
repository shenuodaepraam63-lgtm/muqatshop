-- Follow-up to 20261105_admin_rbac_foundation.sql
-- Branch: feat/admin-rbac-1a — DO NOT APPLY TO PRODUCTION without approval

-- 1) FK: prevent accidental staff loss when auth.users is deleted
ALTER TABLE public.admin_staff
  DROP CONSTRAINT IF EXISTS admin_staff_user_id_fkey;

ALTER TABLE public.admin_staff
  ADD CONSTRAINT admin_staff_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE RESTRICT;

-- 2) Atomic one-time bootstrap (service_role only)
CREATE OR REPLACE FUNCTION public.admin_bootstrap_super_admin(
  p_user_id uuid,
  p_email text DEFAULT NULL,
  p_display_name text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_done timestamptz;
  v_staff_id uuid;
  v_role_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'USER_ID_REQUIRED');
  END IF;

  PERFORM pg_advisory_xact_lock(87201405);

  SELECT bootstrap_completed_at INTO v_done
  FROM public.admin_bootstrap_state
  WHERE id = 1
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.admin_bootstrap_state (id, notes)
    VALUES (1, 'seeded by bootstrap fn')
    ON CONFLICT (id) DO NOTHING;
    SELECT bootstrap_completed_at INTO v_done
    FROM public.admin_bootstrap_state WHERE id = 1 FOR UPDATE;
  END IF;

  IF v_done IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'BOOTSTRAP_ALREADY_COMPLETED',
      'completed_at', v_done
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'AUTH_USER_NOT_FOUND');
  END IF;

  INSERT INTO public.admin_staff (user_id, email, display_name, status)
  VALUES (p_user_id, COALESCE(p_email, ''), p_display_name, 'active')
  ON CONFLICT (user_id) DO UPDATE
    SET status = 'active',
        email = COALESCE(EXCLUDED.email, public.admin_staff.email),
        display_name = COALESCE(EXCLUDED.display_name, public.admin_staff.display_name),
        updated_at = now()
  RETURNING id INTO v_staff_id;

  SELECT id INTO v_role_id FROM public.admin_roles WHERE code = 'super_admin' LIMIT 1;
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'super_admin role missing';
  END IF;

  INSERT INTO public.admin_staff_roles (staff_id, role_id)
  VALUES (v_staff_id, v_role_id)
  ON CONFLICT DO NOTHING;

  UPDATE public.admin_bootstrap_state
  SET bootstrap_completed_at = now(),
      bootstrap_user_id = p_user_id,
      notes = COALESCE(p_notes, notes)
  WHERE id = 1;

  RETURN jsonb_build_object('ok', true, 'staff_id', v_staff_id, 'user_id', p_user_id);
END;
$$;

-- 3) Re-assert permission policy on admin_has_permission (Super Admin before deny)
CREATE OR REPLACE FUNCTION public.admin_has_permission(p_code text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_id uuid;
  v_perm_id uuid;
  v_deny boolean;
  v_grant boolean;
  v_role_has boolean;
BEGIN
  SELECT s.id INTO v_staff_id FROM public.admin_staff s
  WHERE s.user_id = auth.uid() AND s.status = 'active' LIMIT 1;
  IF v_staff_id IS NULL THEN RETURN false; END IF;

  -- Super Admin: full access; deny overrides do not apply
  IF EXISTS (
    SELECT 1 FROM public.admin_staff_roles sr
    JOIN public.admin_roles r ON r.id = sr.role_id
    WHERE sr.staff_id = v_staff_id
      AND r.code = 'super_admin'
      AND r.is_active = true
  ) THEN
    RETURN true;
  END IF;

  SELECT id INTO v_perm_id FROM public.admin_permissions WHERE code = p_code LIMIT 1;
  IF v_perm_id IS NULL THEN RETURN false; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.admin_staff_permission_overrides o
    WHERE o.staff_id = v_staff_id AND o.permission_id = v_perm_id AND o.effect = 'deny'
  ) INTO v_deny;
  IF v_deny THEN RETURN false; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.admin_staff_permission_overrides o
    WHERE o.staff_id = v_staff_id AND o.permission_id = v_perm_id AND o.effect = 'grant'
  ) INTO v_grant;
  IF v_grant THEN RETURN true; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.admin_staff_roles sr
    JOIN public.admin_role_permissions rp ON rp.role_id = sr.role_id
    JOIN public.admin_roles r ON r.id = sr.role_id AND r.is_active = true
    WHERE sr.staff_id = v_staff_id AND rp.permission_id = v_perm_id
  ) INTO v_role_has;

  RETURN COALESCE(v_role_has, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_active_admin_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_staff s
    WHERE s.user_id = auth.uid() AND s.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_active_admin_staff();
$$;

-- 4) Lock down SECURITY DEFINER execute privileges
REVOKE ALL ON FUNCTION public.is_active_admin_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_has_permission(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_bootstrap_super_admin(uuid, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_active_admin_staff() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_has_permission(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_bootstrap_super_admin(uuid, text, text, text) TO service_role;

COMMENT ON FUNCTION public.admin_has_permission(text) IS
  'Super Admin ignores deny overrides; non-super: deny > grant > role';
COMMENT ON FUNCTION public.admin_bootstrap_super_admin(uuid, text, text, text) IS
  'Atomic one-time Super Admin bootstrap; service_role only';
COMMENT ON TABLE public.admin_staff IS
  'Platform admin operators; sole source of truth after bootstrap';
