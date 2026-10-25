-- Nested categories + merchant products (already applied on production Supabase)
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories(parent_id);
