-- تشغيل مرة واحدة في Supabase SQL Editor
-- يفعّل الفروع المتداخلة للتصنيفات (ملابس → ملابس منزلية → بيجامات)

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories(parent_id);

-- اختياري: منع أن يكون التصنيف أباً لنفسه (مستوى التطبيق يمنع ذلك أيضاً)
-- لا نضيف CHECK معقد هنا لتجنب مشاكل التحديثات المتداخلة
