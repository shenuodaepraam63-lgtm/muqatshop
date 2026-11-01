/** Lightweight structured monitoring — no external SaaS required. */

type Level = "info" | "warn" | "error";

export function track(
  event: string,
  payload?: Record<string, unknown>,
  level: Level = "info"
) {
  const line = {
    ts: new Date().toISOString(),
    event,
    level,
    ...payload,
  };
  if (level === "error") console.error("[monitor]", JSON.stringify(line));
  else if (level === "warn") console.warn("[monitor]", JSON.stringify(line));
  else console.info("[monitor]", JSON.stringify(line));
}

export function trackOrderError(
  scope: string,
  orderId: string | undefined,
  error: unknown
) {
  track(
    "order.error",
    {
      scope,
      orderId,
      message: error instanceof Error ? error.message : String(error),
    },
    "error"
  );
}
