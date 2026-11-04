# Phase 2 — Admin operations audit

| Area | Ops | Client before | After on branch |
|------|-----|---------------|-----------------|
| products | CRUD | browser → API | `/api/admin/products` + requireAdmin |
| order status | UPDATE | browser fallback removed | `/api/orders/[id]/status` |
| categories / groups | CRUD | browser | `/api/admin/mutate` |
| coupons | CRUD | browser | `/api/admin/mutate` |
| gallery_slides | CRUD | browser | `/api/admin/mutate` |
| site_settings | UPSERT | browser | `/api/admin/mutate` |
| detail_section_presets | INSERT/DELETE | browser | `/api/admin/mutate` |
| admin_notifications | UPDATE read_at | browser | `/api/admin/mutate` |
| affiliate/supplier profiles | UPDATE status | browser | `/api/admin/mutate` |
| SELECT lists | read | still browser SELECT | still depends on RLS until migration |

All mutate ops: requireAdmin → then service role. Allowlisted tables/keys only.
