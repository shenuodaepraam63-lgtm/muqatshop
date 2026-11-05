import { getSupabaseServiceClient } from "@/lib/supabase-server";
import {
  hashIdentityToken,
  mintIdentityToken,
  verifyIdentityCookie,
  readIdentityFromRequest,
  identitySetCookieHeader,
} from "./cookies";

export type ResolvedVisitor = {
  visitorId: string;
  setCookie?: string;
};

export async function resolveOrCreateVisitor(
  request: Request
): Promise<ResolvedVisitor> {
  const admin = getSupabaseServiceClient();
  const raw = readIdentityFromRequest(request);
  const verified = verifyIdentityCookie(raw);

  if (verified) {
    const hash = hashIdentityToken(verified.token);
    const { data } = await admin
      .from("analytics_visitors")
      .select("id")
      .eq("identity_token_hash", hash)
      .maybeSingle();

    if (data?.id) {
      await admin
        .from("analytics_visitors")
        .update({
          last_seen_at: new Date().toISOString(),
          identity_expires_at: new Date(verified.expiresAtMs).toISOString(),
        })
        .eq("id", data.id);
      return { visitorId: data.id as string };
    }
  }

  const minted = mintIdentityToken();
  const hash = hashIdentityToken(minted.token);
  const { data: created, error } = await admin
    .from("analytics_visitors")
    .insert({
      identity_token_hash: hash,
      identity_expires_at: new Date(minted.expiresAtMs).toISOString(),
    })
    .select("id")
    .single();

  if (error || !created?.id) {
    throw new Error(error?.message || "VISITOR_CREATE_FAILED");
  }

  return {
    visitorId: created.id as string,
    setCookie: identitySetCookieHeader(minted.cookieValue, minted.expiresAtMs),
  };
}
