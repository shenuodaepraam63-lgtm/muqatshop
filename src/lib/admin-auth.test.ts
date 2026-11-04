/**
 * Lightweight pure tests for admin-auth helpers (no live Supabase).
 * Run: npm run test:security-unit
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("admin-auth module contract", () => {
  it("exports requireAdmin and resolveAdminFromRequest", async () => {
    const mod = await import("./admin-auth.ts");
    assert.equal(typeof mod.requireAdmin, "function");
    assert.equal(typeof mod.resolveAdminFromRequest, "function");
    assert.equal(typeof mod.isAdminAuthSuccess, "function");
  });

  it("isAdminAuthSuccess distinguishes successes", async () => {
    const { isAdminAuthSuccess } = await import("./admin-auth.ts");
    assert.equal(
      isAdminAuthSuccess({
        ok: true,
        user: {} as never,
        email: "a@b.c",
        source: "allowlist",
      }),
      true
    );
  });
});
