import { adminJson } from "@/lib/admin-api";

/** Persist product create/update through server requireAdmin + service role. */
export async function saveProductAdmin(
  payload: Record<string, unknown>,
  productId?: string
): Promise<void> {
  if (productId) {
    await adminJson(`/api/admin/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return;
  }
  await adminJson("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
