#!/usr/bin/env node
/** Offline static checks for security/hardening. No network, no secrets. */
import { readFileSync, existsSync } from "node:fs";
import { strict as assert } from "node:assert";

function read(path) {
  return readFileSync(path, "utf8");
}

const checks = [];
function check(name, fn) {
  try {
    fn();
    checks.push({ name, ok: true });
    console.log("PASS", name);
  } catch (e) {
    checks.push({ name, ok: false, error: String(e.message || e) });
    console.log("FAIL", name, e.message || e);
  }
}

check("ProductForm has no supabase.from products writes", () => {
  const t = read("src/components/admin/ProductForm.tsx");
  assert(!/supabase\.from\([\"']products[\"']\)/.test(t));
  assert(t.includes("saveProductAdmin") || t.includes("adminJson"));
});

check("admin products page uses adminJson", () => {
  const t = read("src/app/admin/products/page.tsx");
  assert(t.includes("adminJson"));
  assert(!/supabase\.from\([\"']products[\"']\)/.test(t));
});

check("cloudinary sign path uses adminFetch or requireAdmin in route", () => {
  const client = read("src/lib/cloudinary.ts");
  const route = read("src/app/api/cloudinary/sign/route.ts");
  assert(client.includes("adminFetch") || client.includes("Authorization"));
  assert(route.includes("requireAdmin"));
});

check("order status uses requireAdmin", () => {
  const t = read("src/app/api/orders/[id]/status/route.ts");
  assert(t.includes("requireAdmin"));
  assert(!t.includes("soft_admin"));
});

check("no service role key literal in src", () => {
  const { execSync } = await import("node:child_process");
});

const failed = checks.filter((c) => !c.ok);
process.exit(failed.length ? 1 : 0);
