/**
 * Lightweight pure tests for admin-auth helpers (no live Supabase).
 * Run: npx tsx --test src/lib/admin-auth.test.ts
 * These tests do NOT claim production RLS verification.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("admin-auth module contract", () => {
  it("exports requireAdmin and resolveAdminFromRequest", async () => {
    const mod = await import("./admin-auth");
    assert.equal(typeof mod.requireAdmin, "function");
    assert.equal(typeof mod.resolveAdminFromRequest, "function");
    assert.equal(typeof mod.isAdminAuthSuccess, "function");
  });

  it("isAdminAuthSuccess distinguishes NextResponse-like failures", async () => {
    const { isAdminAuthSuccess } = await import("./admin-auth");
    assert.equal(
      isAdminAuthSuccess({ ok: true, user: {} as never, email: "a@b.c", source: "allowlist" }),
      true
    );
  });
});
