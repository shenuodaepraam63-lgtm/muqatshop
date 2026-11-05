export const ALLOWED_EVENT_TYPES = [
  "page_view",
  "product_view",
  "category_view",
  "search",
  "signup",
  "login",
  "add_to_cart",
  "remove_from_cart",
  "begin_checkout",
  "purchase",
] as const;

export type AnalyticsEventType = (typeof ALLOWED_EVENT_TYPES)[number];

export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const HEARTBEAT_MAX_SECONDS = 45;
export const IDENTITY_COOKIE_NAME = "mqs_analytics_identity";
export const IDENTITY_TTL_DAYS = 400;

export function isAllowedEventType(v: string): v is AnalyticsEventType {
  return (ALLOWED_EVENT_TYPES as readonly string[]).includes(v);
}
