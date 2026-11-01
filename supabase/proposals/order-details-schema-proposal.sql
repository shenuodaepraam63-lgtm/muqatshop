-- =============================================================================
-- MUQATSHOP — Order Details Schema Extension (PROPOSAL)
-- Branch: order-details-schema-proposal
--
-- PURPOSE
--   Extend the existing orders/order_shipments foundation for:
--   - immutable order-line snapshots
--   - explicit shipment-to-item assignment
--   - shipment tracking events and ETA change history
--   - named additional fee lines
--   - auditable order/shipment changes
--
-- SAFETY
--   This is a proposed additive migration only.
--   It has NOT been applied to Supabase or production.
--   Review against the live schema and test on staging before execution.
--   Existing orders.items and order_shipments.items JSONB are retained for
--   backward compatibility. Existing orders address columns remain canonical
--   until application code is migrated to address_snapshot.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Additive snapshot and ETA fields
-- ---------------------------------------------------------------------------

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS address_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS address_latitude numeric(10,7),
  ADD COLUMN IF NOT EXISTS address_longitude numeric(10,7);

COMMENT ON COLUMN public.orders.address_snapshot IS
  'Immutable checkout-time address snapshot; legacy address columns remain supported.';
COMMENT ON COLUMN public.orders.address_latitude IS
  'Checkout-time latitude, nullable; only populated from verified customer input.';
COMMENT ON COLUMN public.orders.address_longitude IS
  'Checkout-time longitude, nullable; only populated from verified customer input.';

-- Backfill snapshot from existing order columns without overwriting existing snapshots.
UPDATE public.orders
SET address_snapshot = jsonb_strip_nulls(jsonb_build_object(
  'customer_name', customer_name,
  'phone', phone,
  'phone_alt', phone_alt,
  'governorate', governorate,
  'center', center,
  'area', area,
  'street', street,
  'apartment', apartment
))
WHERE address_snapshot IS NULL;

ALTER TABLE public.order_shipments
  ADD COLUMN IF NOT EXISTS shipment_number text,
  ADD COLUMN IF NOT EXISTS estimated_delivery_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS last_event_at timestamptz;

COMMENT ON COLUMN public.order_shipments.shipment_number IS
  'Customer-safe shipment reference; not an authorization credential.';
COMMENT ON COLUMN public.order_shipments.estimated_delivery_at IS
  'Latest approved ETA. Previous values are retained in shipment_eta_changes.';
COMMENT ON COLUMN public.order_shipments.last_event_at IS
  'Timestamp of the latest recorded tracking event.';

-- ---------------------------------------------------------------------------
-- 1. Immutable order line snapshots
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.order_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  line_number integer NOT NULL CHECK (line_number > 0),
  product_id text,
  product_name text NOT NULL,
  sku text,
  image_url text,
  variant_label text,
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  base_unit_price numeric(12,2) CHECK (base_unit_price IS NULL OR base_unit_price >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total numeric(12,2) NOT NULL CHECK (line_total >= 0),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_order_line_items_order
  ON public.order_line_items (order_id, line_number);

COMMENT ON TABLE public.order_line_items IS
  'Normalized immutable item snapshots captured at order creation.';

-- Safe, repeatable backfill from the legacy orders.items JSONB array.
-- Invalid optional numeric values become NULL/default rather than aborting the migration.
INSERT INTO public.order_line_items (
  order_id, line_number, product_id, product_name, image_url,
  variant_label, unit_price, base_unit_price, quantity, line_total, snapshot
)
SELECT
  o.id,
  item.ordinality::integer,
  COALESCE(item.value ->> 'productId', item.value ->> 'product_id'),
  COALESCE(NULLIF(item.value ->> 'name', ''), 'منتج'),
  NULLIF(item.value ->> 'image', ''),
  NULLIF(item.value ->> 'variant', ''),
  CASE
    WHEN COALESCE(item.value ->> 'price', '') ~ '^[0-9]+(\\.[0-9]+)?$'
      THEN (item.value ->> 'price')::numeric(12,2)
    ELSE 0
  END,
  CASE
    WHEN COALESCE(item.value ->> 'basePrice', '') ~ '^[0-9]+(\\.[0-9]+)?$'
      THEN (item.value ->> 'basePrice')::numeric(12,2)
    ELSE NULL
  END,
  CASE
    WHEN COALESCE(item.value ->> 'quantity', '') ~ '^[0-9]+$'
      THEN GREATEST(1, (item.value ->> 'quantity')::integer)
    ELSE 1
  END,
  (
    CASE
      WHEN COALESCE(item.value ->> 'price', '') ~ '^[0-9]+(\\.[0-9]+)?$'
        THEN (item.value ->> 'price')::numeric(12,2)
      ELSE 0
    END
    *
    CASE
      WHEN COALESCE(item.value ->> 'quantity', '') ~ '^[0-9]+$'
        THEN GREATEST(1, (item.value ->> 'quantity')::integer)
      ELSE 1
    END
  ),
  item.value
FROM public.orders o
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(o.items) = 'array' THEN o.items ELSE '[]'::jsonb END
) WITH ORDINALITY AS item(value, ordinality)
ON CONFLICT (order_id, line_number) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Explicit assignment of order lines to shipments
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.shipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.order_shipments(id) ON DELETE CASCADE,
  order_line_item_id uuid NOT NULL REFERENCES public.order_line_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shipment_id, order_line_item_id)
);

CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment
  ON public.shipment_items (shipment_id);

CREATE INDEX IF NOT EXISTS idx_shipment_items_order_line
  ON public.shipment_items (order_line_item_id);

COMMENT ON TABLE public.shipment_items IS
  'Maps immutable order lines to shipments; supports split shipments and partial quantities.';

-- Existing orders were backfilled with one primary shipment. Assign all lines
-- only where exactly one shipment exists, avoiding guesses for multi-shipment orders.
INSERT INTO public.shipment_items (shipment_id, order_line_item_id, quantity)
SELECT
  s.id,
  li.id,
  li.quantity
FROM public.order_shipments s
JOIN public.order_line_items li ON li.order_id = s.order_id
WHERE (
  SELECT count(*)
  FROM public.order_shipments sx
  WHERE sx.order_id = s.order_id
) = 1
ON CONFLICT (shipment_id, order_line_item_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Shipment tracking events
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.order_shipments(id) ON DELETE CASCADE,
  event_code text NOT NULL,
  title text NOT NULL,
  description text,
  location_label text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_type text NOT NULL DEFAULT 'system'
    CHECK (actor_type IN ('system', 'admin', 'supplier', 'carrier')),
  actor_id text,
  is_customer_visible boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_time
  ON public.shipment_events (shipment_id, occurred_at ASC, id ASC);

CREATE INDEX IF NOT EXISTS idx_shipment_events_customer_feed
  ON public.shipment_events (shipment_id, occurred_at DESC, id DESC)
  WHERE is_customer_visible = true;

COMMENT ON TABLE public.shipment_events IS
  'Append-only shipment timeline. occurred_at is the actual event time; created_at is database insertion time.';

-- ---------------------------------------------------------------------------
-- 4. Shipment ETA history
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.shipment_eta_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.order_shipments(id) ON DELETE CASCADE,
  previous_eta timestamptz,
  new_eta timestamptz NOT NULL,
  change_reason text,
  changed_by_type text NOT NULL DEFAULT 'admin'
    CHECK (changed_by_type IN ('system', 'admin', 'supplier', 'carrier')),
  changed_by_id text,
  approved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipment_eta_changes_history
  ON public.shipment_eta_changes (shipment_id, approved_at DESC, id DESC);

COMMENT ON TABLE public.shipment_eta_changes IS
  'Append-only approved ETA changes; current ETA is mirrored on order_shipments.';

-- ---------------------------------------------------------------------------
-- 5. Named additional order fee lines
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.order_fee_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  fee_code text,
  fee_name text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_fee_lines_order
  ON public.order_fee_lines (order_id, sort_order, created_at);

COMMENT ON TABLE public.order_fee_lines IS
  'Additional named fees actually charged. Existing orders.shipping remains the shipping amount.';

-- ---------------------------------------------------------------------------
-- 6. Full audit log for important order and shipment mutations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.order_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  entity_type text NOT NULL
    CHECK (entity_type IN ('order', 'shipment', 'order_line_item', 'fee', 'eta')),
  entity_id uuid,
  action text NOT NULL,
  actor_type text NOT NULL
    CHECK (actor_type IN ('system', 'admin', 'customer', 'supplier', 'carrier')),
  actor_id text,
  before_data jsonb,
  after_data jsonb,
  request_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_audit_logs_order_time
  ON public.order_audit_logs (order_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_order_audit_logs_entity
  ON public.order_audit_logs (entity_type, entity_id, created_at DESC);

COMMENT ON TABLE public.order_audit_logs IS
  'Append-only audit records for material order/shipment changes. Writes must be server-controlled.';

-- ---------------------------------------------------------------------------
-- 7. Ownership-based SELECT policies for authenticated customers
--    Writes remain server/service-role only. Service role bypasses RLS.
-- ---------------------------------------------------------------------------

ALTER TABLE public.order_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_eta_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_fee_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_line_items_select_own ON public.order_line_items;
CREATE POLICY order_line_items_select_own
  ON public.order_line_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (
          o.customer_email = auth.jwt() ->> 'email'
          OR o.customer_id IN (
            SELECT c.id FROM public.customers c WHERE c.auth_user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS shipment_items_select_own ON public.shipment_items;
CREATE POLICY shipment_items_select_own
  ON public.shipment_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.order_shipments s
      JOIN public.orders o ON o.id = s.order_id
      WHERE s.id = shipment_id
        AND (
          o.customer_email = auth.jwt() ->> 'email'
          OR o.customer_id IN (
            SELECT c.id FROM public.customers c WHERE c.auth_user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS shipment_events_select_own ON public.shipment_events;
CREATE POLICY shipment_events_select_own
  ON public.shipment_events
  FOR SELECT TO authenticated
  USING (
    is_customer_visible
    AND EXISTS (
      SELECT 1
      FROM public.order_shipments s
      JOIN public.orders o ON o.id = s.order_id
      WHERE s.id = shipment_id
        AND (
          o.customer_email = auth.jwt() ->> 'email'
          OR o.customer_id IN (
            SELECT c.id FROM public.customers c WHERE c.auth_user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS shipment_eta_changes_select_own ON public.shipment_eta_changes;
CREATE POLICY shipment_eta_changes_select_own
  ON public.shipment_eta_changes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.order_shipments s
      JOIN public.orders o ON o.id = s.order_id
      WHERE s.id = shipment_id
        AND (
          o.customer_email = auth.jwt() ->> 'email'
          OR o.customer_id IN (
            SELECT c.id FROM public.customers c WHERE c.auth_user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS order_fee_lines_select_own ON public.order_fee_lines;
CREATE POLICY order_fee_lines_select_own
  ON public.order_fee_lines
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (
          o.customer_email = auth.jwt() ->> 'email'
          OR o.customer_id IN (
            SELECT c.id FROM public.customers c WHERE c.auth_user_id = auth.uid()
          )
        )
    )
  );

-- Audit data is intentionally not exposed to customer clients.
-- Access is through authenticated server routes using the service role.

COMMIT;

-- =============================================================================
-- POST-MIGRATION REVIEW (do not skip)
--
-- 1. Verify the live orders table has: id, items, customer_id, customer_email,
--    customer_name, phone, phone_alt, governorate, center, area, street,
--    apartment, subtotal, shipping, discount, coupon_code, total, status,
--    created_at, updated_at.
-- 2. Verify order_shipments and order_status_events from
--    20261101_order_foundation.sql already exist.
-- 3. Review existing RLS policies and ensure authenticated SELECT policies do
--    not expose rows to users who do not own the parent order.
-- 4. Add new tables to Supabase Realtime publication only after checking the
--    current publication configuration and deciding which tables need it.
-- 5. Add server-side write transactions for shipment events, ETA changes,
--    fee lines, audit rows, and order-line snapshots.
-- 6. Do not run on production without a separate explicit approval.
-- =============================================================================
