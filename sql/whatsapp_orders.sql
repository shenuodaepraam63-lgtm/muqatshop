-- WhatsApp order messaging support (run in Supabase SQL editor once)
-- Non-destructive: only adds columns/table if missing.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS wa_received_message_id text,
  ADD COLUMN IF NOT EXISTS wa_received_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS wa_confirmed_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS wa_cancelled_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS customer_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_source text;

CREATE TABLE IF NOT EXISTS public.whatsapp_processed_messages (
  wamid text PRIMARY KEY,
  action text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_wa_received_message_id
  ON public.orders (wa_received_message_id)
  WHERE wa_received_message_id IS NOT NULL;

-- Optional: allow service role only updates; RLS stays as you configured it.
