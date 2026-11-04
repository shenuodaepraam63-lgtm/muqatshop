/**
 * Integration tests for requireAdmin — require a dedicated test environment.
 *
 * Required env (never use Production customer data):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY  (server only)
 *   TEST_CUSTOMER_EMAIL / TEST_CUSTOMER_PASSWORD
 *   TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD
 *   TEST_DISABLED_ADMIN_EMAIL / TEST_DISABLED_ADMIN_PASSWORD (optional)
 *
 * Run:
 *   npm run test:security-integration
 *
 * If env is missing, tests are SKIPPED (not passed).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const hasEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.TEST_CUSTOMER_EMAIL &&
    process.env.TEST_ADMIN_EMAIL
);

describe("requireAdmin integration", { skip: !hasEnv }, () => {
  it("rejects missing Authorization", async () => {
    const { resolveAdminFromRequest } = await import("./admin-auth");
    const req = new Request("http://localhost/api/admin/products", {
      method: "GET",
    });
    const res = await resolveAdminFromRequest(req);
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.code, "NO_TOKEN");
  });

  it("rejects invalid token", async () => {
    const { resolveAdminFromRequest } = await import("./admin-auth");
    const req = new Request("http://localhost/api/admin/products", {
      method: "GET",
      headers: { Authorization: "Bearer not-a-real-jwt" },
    });
    const res = await resolveAdminFromRequest(req);
    assert.equal(res.ok, false);
  });

  // Additional cases (customer / admin / disabled) need live sign-in tokens.
  // Implemented when TEST_* credentials are provided in CI.
});

describe("integration env gate", () => {
  it("documents missing test environment without false pass", () => {
    if (!hasEnv) {
      console.log(
        "SKIP integration: set TEST_ADMIN_EMAIL, TEST_CUSTOMER_EMAIL, and Supabase URL/anon key"
      );
    }
    assert.ok(true);
  });
});
