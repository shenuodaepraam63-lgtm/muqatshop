/**
 * Isolated pure-policy tests for RBAC decisions (no Supabase, no network).
 * Run: node src/lib/__tests__/admin-auth-policy.test.mjs
 */

function isUndefinedTableError(error) {
  const msg = (error.message || "").toLowerCase();
  const code = String(error.code || "");
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find the table")
  );
}

function resolveCodes({ isSuper, roleCodes, overrides }) {
  if (isSuper) return [...roleCodes].sort();
  const codes = new Set(roleCodes);
  for (const o of overrides) {
    if (o.effect === "grant") codes.add(o.code);
  }
  for (const o of overrides) {
    if (o.effect === "deny") codes.delete(o.code);
  }
  return [...codes].sort();
}

function decideWhenTablesExist({
  staff,
  bootstrapCompleted,
  bootstrapError,
  staffLookupError,
  emailOnAllowlist,
}) {
  if (staffLookupError) return { ok: false, code: "STAFF_LOOKUP_FAILED", status: 503 };
  if (staff) {
    if (staff.status !== "active")
      return { ok: false, code: "STAFF_INACTIVE", status: 403 };
    return { ok: true, source: "admin_staff" };
  }
  if (bootstrapError)
    return { ok: false, code: "BOOTSTRAP_LOOKUP_FAILED", status: 503 };
  if (!bootstrapCompleted && emailOnAllowlist)
    return { ok: true, source: "allowlist_bootstrap" };
  return { ok: false, code: "NOT_ADMIN_STAFF", status: 403 };
}

function decideWhenTablesMissing({ profileAdmin, rpcAdmin, emailOnAllowlist }) {
  if (profileAdmin) return { ok: true, source: "profile_admin" };
  if (rpcAdmin) return { ok: true, source: "rpc" };
  if (emailOnAllowlist) return { ok: true, source: "allowlist_legacy" };
  return { ok: false, code: "NOT_ADMIN", status: 403 };
}

let passed = 0;
let failed = 0;
function assert(name, cond) {
  if (cond) {
    passed++;
    console.log("PASS", name);
  } else {
    failed++;
    console.error("FAIL", name);
  }
}

assert("42P01 is missing table", isUndefinedTableError({ code: "42P01" }));
assert(
  "timeout is NOT missing table",
  !isUndefinedTableError({ code: "57014", message: "canceling statement due to statement timeout" })
);
assert(
  "permission denied is NOT missing table",
  !isUndefinedTableError({ code: "42501", message: "permission denied for table admin_staff" })
);
assert(
  "connection error is NOT missing table",
  !isUndefinedTableError({ message: "fetch failed" })
);
assert(
  "profile alone cannot grant when tables exist",
  decideWhenTablesExist({
    staff: null,
    bootstrapCompleted: true,
    bootstrapError: false,
    staffLookupError: false,
    emailOnAllowlist: false,
  }).code === "NOT_ADMIN_STAFF"
);
assert(
  "allowlist blocked after bootstrap complete",
  decideWhenTablesExist({
    staff: null,
    bootstrapCompleted: true,
    bootstrapError: false,
    staffLookupError: false,
    emailOnAllowlist: true,
  }).code === "NOT_ADMIN_STAFF"
);
assert(
  "allowlist bootstrap only before complete",
  decideWhenTablesExist({
    staff: null,
    bootstrapCompleted: false,
    bootstrapError: false,
    staffLookupError: false,
    emailOnAllowlist: true,
  }).source === "allowlist_bootstrap"
);
assert(
  "active staff ok",
  decideWhenTablesExist({
    staff: { status: "active" },
    bootstrapCompleted: true,
    bootstrapError: false,
    staffLookupError: false,
    emailOnAllowlist: false,
  }).source === "admin_staff"
);
assert(
  "suspended staff denied",
  decideWhenTablesExist({
    staff: { status: "suspended" },
    bootstrapCompleted: true,
    bootstrapError: false,
    staffLookupError: false,
    emailOnAllowlist: true,
  }).code === "STAFF_INACTIVE"
);
assert(
  "staff lookup error → 503",
  decideWhenTablesExist({
    staff: null,
    bootstrapCompleted: false,
    bootstrapError: false,
    staffLookupError: true,
    emailOnAllowlist: true,
  }).status === 503
);
assert(
  "bootstrap lookup error → 503 not allowlist",
  decideWhenTablesExist({
    staff: null,
    bootstrapCompleted: false,
    bootstrapError: true,
    staffLookupError: false,
    emailOnAllowlist: true,
  }).status === 503
);
assert(
  "legacy profile when missing table",
  decideWhenTablesMissing({
    profileAdmin: true,
    rpcAdmin: false,
    emailOnAllowlist: false,
  }).source === "profile_admin"
);
assert(
  "legacy allowlist when missing table",
  decideWhenTablesMissing({
    profileAdmin: false,
    rpcAdmin: false,
    emailOnAllowlist: true,
  }).source === "allowlist_legacy"
);
assert(
  "super ignores deny",
  resolveCodes({
    isSuper: true,
    roleCodes: ["a", "b", "c"],
    overrides: [{ code: "b", effect: "deny" }],
  }).join(",") === "a,b,c"
);
assert(
  "non-super deny wins",
  resolveCodes({
    isSuper: false,
    roleCodes: ["a", "b"],
    overrides: [
      { code: "c", effect: "grant" },
      { code: "b", effect: "deny" },
    ],
  }).join(",") === "a,c"
);

console.log("\nResult:", passed, "passed,", failed, "failed");
process.exit(failed ? 1 : 0);
