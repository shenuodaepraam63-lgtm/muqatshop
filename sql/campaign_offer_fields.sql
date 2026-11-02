-- Optional offer fields on gallery_slides (campaigns)
-- Run once in Supabase SQL editor if columns do not exist yet.

ALTER TABLE gallery_slides
  ADD COLUMN IF NOT EXISTS offer_price numeric,
  ADD COLUMN IF NOT EXISTS offer_compare_price numeric,
  ADD COLUMN IF NOT EXISTS duration_label text;
