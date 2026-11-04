import { supabase } from "@/lib/supabase";

/**
 * Browser helper for admin API calls.
 * Always sends the current Supabase access token; server re-validates via getUser.
 */
export async function getAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}

export async function adminFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("جلسة الإدارة منتهية — سجّل الدخول مجددًا");
  }
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...init, headers, cache: "no-store" });
}

export async function adminJson<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await adminFetch(path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data as { error?: string })?.error ||
      `طلب فشل (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}
