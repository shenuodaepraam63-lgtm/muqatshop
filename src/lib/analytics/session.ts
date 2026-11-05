import { getSupabaseServiceClient } from "@/lib/supabase-server";
import { HEARTBEAT_MAX_SECONDS, SESSION_IDLE_MS } from "./types";

export async function getOrCreateSession(opts: {
  visitorId: string;
  entryPath?: string | null;
  userId?: string | null;
}): Promise<{ sessionId: string; created: boolean }> {
  const admin = getSupabaseServiceClient();
  const cutoff = new Date(Date.now() - SESSION_IDLE_MS).toISOString();

  const { data: open } = await admin
    .from("analytics_sessions")
    .select("id, last_activity_at")
    .eq("visitor_id", opts.visitorId)
    .is("ended_at", null)
    .gte("last_activity_at", cutoff)
    .order("last_activity_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (open?.id) {
    await admin
      .from("analytics_sessions")
      .update({
        last_activity_at: new Date().toISOString(),
        ...(opts.userId ? { user_id: opts.userId } : {}),
      })
      .eq("id", open.id);
    return { sessionId: open.id as string, created: false };
  }

  // close stale open sessions
  await admin
    .from("analytics_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("visitor_id", opts.visitorId)
    .is("ended_at", null);

  const { data: created, error } = await admin
    .from("analytics_sessions")
    .insert({
      visitor_id: opts.visitorId,
      user_id: opts.userId || null,
      entry_path: opts.entryPath?.slice(0, 500) || null,
      exit_path: opts.entryPath?.slice(0, 500) || null,
    })
    .select("id")
    .single();

  if (error || !created?.id) {
    throw new Error(error?.message || "SESSION_CREATE_FAILED");
  }

  await admin.rpc("" as never).catch(() => undefined);
  await admin
    .from("analytics_visitors")
    .update({
      last_seen_at: new Date().toISOString(),
      total_sessions: undefined as never,
    })
    .eq("id", opts.visitorId)
    .then(() => undefined);

  // increment total_sessions safely
  const { data: vis } = await admin
    .from("analytics_visitors")
    .select("total_sessions")
    .eq("id", opts.visitorId)
    .maybeSingle();
  await admin
    .from("analytics_visitors")
    .update({
      total_sessions: Number(vis?.total_sessions || 0) + 1,
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", opts.visitorId);

  return { sessionId: created.id as string, created: true };
}

export async function applyHeartbeat(opts: {
  visitorId: string;
  sessionId: string;
}): Promise<{ ok: boolean; activeSeconds?: number; reason?: string }> {
  const admin = getSupabaseServiceClient();
  const { data: session } = await admin
    .from("analytics_sessions")
    .select("id, visitor_id, ended_at, last_activity_at, active_seconds")
    .eq("id", opts.sessionId)
    .maybeSingle();

  if (!session || session.visitor_id !== opts.visitorId) {
    return { ok: false, reason: "SESSION_MISMATCH" };
  }
  if (session.ended_at) {
    return { ok: false, reason: "SESSION_ENDED" };
  }

  const last = new Date(session.last_activity_at as string).getTime();
  const now = Date.now();
  if (now - last > SESSION_IDLE_MS) {
    await admin
      .from("analytics_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", opts.sessionId);
    return { ok: false, reason: "SESSION_EXPIRED" };
  }

  const deltaSec = Math.min(
    HEARTBEAT_MAX_SECONDS,
    Math.max(0, Math.floor((now - last) / 1000))
  );
  const nextActive = Number(session.active_seconds || 0) + deltaSec;

  await admin
    .from("analytics_sessions")
    .update({
      last_activity_at: new Date(now).toISOString(),
      active_seconds: nextActive,
    })
    .eq("id", opts.sessionId);

  await admin
    .from("analytics_visitors")
    .update({ last_seen_at: new Date(now).toISOString() })
    .eq("id", opts.visitorId);

  return { ok: true, activeSeconds: nextActive };
}

export async function endSession(opts: {
  visitorId: string;
  sessionId: string;
  exitPath?: string | null;
}) {
  const admin = getSupabaseServiceClient();
  await admin
    .from("analytics_sessions")
    .update({
      ended_at: new Date().toISOString(),
      ...(opts.exitPath ? { exit_path: opts.exitPath.slice(0, 500) } : {}),
    })
    .eq("id", opts.sessionId)
    .eq("visitor_id", opts.visitorId)
    .is("ended_at", null);
}
