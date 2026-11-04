# Sensitive API Audit (branch security/hardening)

| Route | Auth | Notes |
|-------|------|-------|
| POST /api/cloudinary/sign | requireAdmin | Folder must start with muqatshop/ |
| GET/PUT /api/admin/homepage-settings | requireAdmin | |
| GET/POST /api/admin/products | requireAdmin + service | |
| GET/PATCH/DELETE /api/admin/products/[id] | requireAdmin + service | soft delete default; hard=?hard=1 |
| POST /api/admin/notify-event | none + rate limit | notification only |
| POST /api/orders/[id]/status | requireAdmin (hard) | was soft-open via missing profiles.role |
| POST /api/orders/create | public create path | prices must come from DB server-side |
| POST /api/otp/send | purpose-based | needs rate limit review on Production apply |
| POST /api/webhooks/whatsapp | Meta signature | OK |

requireAdmin: Bearer JWT → auth.getUser(anon) → profiles.account_type admin → rpc is_platform_admin → env allowlist bridge.
Service role only after success.
