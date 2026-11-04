import { adminJson } from "@/lib/admin-api";

export type AdminMutateOp = "insert" | "update" | "delete" | "upsert";

export async function adminMutate<T = unknown>(opts: {
  table: string;
  op: AdminMutateOp;
  id?: string;
  match?: Record<string, unknown>;
  data?: Record<string, unknown>;
  select?: string;
}): Promise<{ ok: true; data?: T; deleted?: boolean }> {
  return adminJson("/api/admin/mutate", {
    method: "POST",
    body: JSON.stringify(opts),
  });
}
