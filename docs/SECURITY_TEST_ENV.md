# Supabase Test Environment (NOT Production)

## Goal
Run admin permission integration tests without touching production data or keys.

## Setup
1. Create a **new** Supabase project (e.g. `muqatshop-test`).
2. Apply schema from production **structure only** — never copy real customer PII.
3. Seed minimal fixtures: active product, customer, active admin (`profiles.account_type=admin`), suspended admin (`is_active=false`).
4. Store secrets in local env / CI only (never commit):
   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
   TEST_CUSTOMER_EMAIL/PASSWORD, TEST_ADMIN_EMAIL/PASSWORD, TEST_DISABLED_ADMIN_*, ADMIN_EMAILS.

## Run
```
npm run test:security-unit
npm run test:security-integration
```
Integration suite **skips** (not pass) when TEST_* env is missing.
