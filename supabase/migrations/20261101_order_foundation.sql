-- =============================================================================
-- Muqatshop — Order Details Foundation (permanent schema)
-- Run ONCE on Supabase SQL Editor (or via CLI) after explicit approval.
-- Safe to re-run: uses IF NOT EXISTS / additive columns.
-- =============================================================================

-- 1) Optimistic concurrency on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cod';

COMMENT ON COLUMN public.orders.version IS 'Incremented on each status/business update; prevents stale writes';

-- 2) Status / audit event log (full history for customer + admin)
CREATE TABLE IF NOT EXISTS public.order_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  actor_type text NOT NULL DEFAULT 'system', -- system | admin | customer | merchant
  actor_id text,
  note text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_events_order_created
  ON public.order_status_events (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_status_events_created
  ON public.order_status_events (created_at DESC);

COMMENT ON TABLE public.order_status_events IS 'Append-only status/audit trail for orders';

-- 3) Shipments (one or many per order)
CREATE TABLE IF NOT EXISTS public.order_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'الشحنة الرئيسية',
  status text NOT NULL DEFAULT 'new',
  carrier text,
  tracking_number text,
  items jsonb DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_shipments_order
  ON public.order_shipments (order_id, sort_order);

COMMENT ON TABLE public.order_shipments IS 'Per-order shipments; supports multi-shipment later';

-- 4) Backfill: one primary shipment per existing order (if none)
INSERT INTO public.order_shipments (order_id, label, status, sort_order, updated_at)
SELECT o.id, 'الشحنة الرئيسية', o.status, 0, COALESCE(o.updated_at, o.created_at)
FROM public.orders o
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_shipments s WHERE s.order_id = o.id
);

-- 5) Backfill: initial status event if order has no events
INSERT INTO public.order_status_events (order_id, from_status, to_status, actor_type, note)
SELECT o.id, NULL, o.status, 'system', 'تسجيل أولي للحالة'
FROM public.orders o
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_status_events e WHERE e.order_id = o.id
);

-- 6) RLS: enable; service role bypasses; customers read own via policies if using anon
ALTER TABLE public.order_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_shipments ENABLE ROW LEVEL SECURITY;

-- Policies are restrictive by default; app uses service role for customer APIs.
-- Optional read policies for authenticated customers (ownership via orders.customer):
DROP POLICY IF EXISTS order_status_events_select_own ON public.order_status_events;
CREATE POLICY order_status_events_select_own
  ON public.order_status_events
  FOR SELECT
  TO authenticated
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

DROP POLICY IF EXISTS order_shipments_select_own ON public.order_shipments;
CREATE POLICY order_shipments_select_own
  ON public.order_shipments
  FOR SELECT
  TO authenticated
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

-- No INSERT/UPDATE/DELETE for authenticated on events/shipments (admin/service only).
