-- Muqatshop Admin RBAC Foundation
-- Migration: 20261105_admin_rbac_foundation
-- DO NOT APPLY TO PRODUCTION without explicit approval
-- RLS only on RBAC tables — not orders/products/customers

CREATE TABLE IF NOT EXISTS public.admin_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  email text,
  display_name text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'terminated')),
  data_scope text NOT NULL DEFAULT 'all',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_staff_status_idx ON public.admin_staff (status);

CREATE TABLE IF NOT EXISTS public.admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  name_en text,
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  module text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  description_ar text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_role_permissions (
  role_id uuid NOT NULL REFERENCES public.admin_roles (id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.admin_permissions (id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.admin_staff_roles (
  staff_id uuid NOT NULL REFERENCES public.admin_staff (id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.admin_roles (id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.admin_staff_permission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.admin_staff (id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.admin_permissions (id) ON DELETE CASCADE,
  effect text NOT NULL CHECK (effect IN ('grant', 'deny')),
  reason text,
  granted_by uuid REFERENCES public.admin_staff (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_id, permission_id)
);

-- One-time bootstrap lock (does NOT re-open merely because no active staff)
CREATE TABLE IF NOT EXISTS public.admin_bootstrap_state (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  bootstrap_completed_at timestamptz,
  bootstrap_user_id uuid,
  notes text
);

INSERT INTO public.admin_bootstrap_state (id, notes)
VALUES (1, 'bootstrap_completed_at NULL = not yet used')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_roles (code, name_ar, name_en, is_system, is_active)
VALUES
  ('super_admin', 'مسؤول المنصة', 'Super Admin', true, true),
  ('sales_manager', 'مسؤول مبيعات', 'Sales Manager', false, true),
  ('support', 'خدمة عملاء', 'Support', false, true),
  ('catalog', 'مسؤول كتالوج', 'Catalog', false, true),
  ('marketing', 'تسويق', 'Marketing', false, true),
  ('merchant_ops', 'عمليات التجار', 'Merchant Ops', false, true),
  ('viewer', 'عرض فقط', 'Viewer', false, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.admin_permissions (code, module, resource, action, description_ar)
VALUES
  ('dashboard.view', 'dashboard', 'dashboard', 'view', 'عرض النظرة العامة'),
  ('customers.list', 'customers', 'customers', 'list', 'قائمة العملاء'),
  ('customers.view', 'customers', 'customers', 'view', 'عرض ملف عميل'),
  ('customers.update', 'customers', 'customers', 'update', 'تعديل بيانات عميل'),
  ('customers.status', 'customers', 'customers', 'status', 'تغيير حالة حساب'),
  ('customers.export', 'customers', 'customers', 'export', 'تصدير العملاء'),
  ('orders.list', 'orders', 'orders', 'list', 'قائمة الطلبات'),
  ('orders.view', 'orders', 'orders', 'view', 'تفاصيل طلب'),
  ('orders.update_status', 'orders', 'orders', 'update_status', 'تحديث حالة طلب'),
  ('products.list', 'products', 'products', 'list', 'قائمة المنتجات'),
  ('products.manage', 'products', 'products', 'manage', 'إدارة المنتجات'),
  ('categories.manage', 'products', 'categories', 'manage', 'إدارة التصنيفات'),
  ('marketing.campaigns', 'marketing', 'campaigns', 'manage', 'الحملات'),
  ('marketing.coupons', 'marketing', 'coupons', 'manage', 'الكوبونات'),
  ('merchants.list', 'merchants', 'merchants', 'list', 'قائمة التجار'),
  ('merchants.manage', 'merchants', 'merchants', 'manage', 'إدارة التجار'),
  ('withdrawals.manage', 'merchants', 'withdrawals', 'manage', 'إدارة السحوبات'),
  ('analytics.view', 'analytics', 'analytics', 'view', 'عرض التحليلات'),
  ('settings.store', 'settings', 'store', 'manage', 'إعدادات المتجر'),
  ('staff.manage', 'staff', 'staff', 'manage', 'إدارة الموظفين'),
  ('roles.manage', 'staff', 'roles', 'manage', 'إدارة الأدوار')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.admin_roles r
CROSS JOIN public.admin_permissions p
WHERE r.code = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.admin_roles r
JOIN public.admin_permissions p ON p.code IN (
  'dashboard.view', 'customers.list', 'customers.view',
  'orders.list', 'orders.view', 'products.list', 'analytics.view'
)
WHERE r.code = 'viewer'
ON CONFLICT DO NOTHING;

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

  IF EXISTS (
    SELECT 1 FROM public.admin_staff_roles sr
    JOIN public.admin_roles r ON r.id = sr.role_id
    WHERE sr.staff_id = v_staff_id AND r.code = 'super_admin' AND r.is_active = true
  ) THEN RETURN true; END IF;

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

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_active_admin_staff();
$$;

ALTER TABLE public.admin_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_staff_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_bootstrap_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_roles_read_active ON public.admin_roles;
CREATE POLICY admin_roles_read_active ON public.admin_roles
  FOR SELECT TO authenticated USING (public.is_active_admin_staff());

DROP POLICY IF EXISTS admin_permissions_read_active ON public.admin_permissions;
CREATE POLICY admin_permissions_read_active ON public.admin_permissions
  FOR SELECT TO authenticated USING (public.is_active_admin_staff());

DROP POLICY IF EXISTS admin_role_perms_read_active ON public.admin_role_permissions;
CREATE POLICY admin_role_perms_read_active ON public.admin_role_permissions
  FOR SELECT TO authenticated USING (public.is_active_admin_staff());

DROP POLICY IF EXISTS admin_staff_select ON public.admin_staff;
CREATE POLICY admin_staff_select ON public.admin_staff
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.admin_has_permission('staff.manage'));

DROP POLICY IF EXISTS admin_staff_roles_select ON public.admin_staff_roles;
CREATE POLICY admin_staff_roles_select ON public.admin_staff_roles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_staff s
      WHERE s.id = staff_id
        AND (s.user_id = auth.uid() OR public.admin_has_permission('staff.manage'))
    )
  );

DROP POLICY IF EXISTS admin_overrides_select ON public.admin_staff_permission_overrides;
CREATE POLICY admin_overrides_select ON public.admin_staff_permission_overrides
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_staff s
      WHERE s.id = staff_id
        AND (s.user_id = auth.uid() OR public.admin_has_permission('staff.manage'))
    )
  );

DROP POLICY IF EXISTS admin_bootstrap_deny_all ON public.admin_bootstrap_state;
CREATE POLICY admin_bootstrap_deny_all ON public.admin_bootstrap_state
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

COMMENT ON TABLE public.admin_staff IS 'Platform admin operators; source of truth for admin panel access';
COMMENT ON TABLE public.admin_bootstrap_state IS 'One-time bootstrap lock';
