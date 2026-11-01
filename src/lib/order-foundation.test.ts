/**
 * Lightweight foundation checks (run: npx tsx src/lib/order-foundation.test.ts)
 * Covers mapping + notification copy without a full test runner.
 */
import { mapShipment, mapStatusEvent } from "./order-foundation";
import { notificationCopy, IMPORTANT_STATUS_NOTIFY } from "./order-status-labels";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const ev = mapStatusEvent({
  id: "1",
  order_id: "o1",
  from_status: "new",
  to_status: "confirmed",
  actor_type: "admin",
  actor_id: "u1",
  note: null,
  created_at: "2026-01-01T00:00:00Z",
});
assert(ev.toStatus === "confirmed", "event map");
assert(ev.orderId === "o1", "event orderId");

const sh = mapShipment({
  id: "s1",
  order_id: "o1",
  label: "الشحنة الرئيسية",
  status: "shipped",
  carrier: "X",
  tracking_number: "T1",
  sort_order: 0,
  shipped_at: null,
  delivered_at: null,
  updated_at: "2026-01-01T00:00:00Z",
});
assert(sh.trackingNumber === "T1", "shipment map");

assert(IMPORTANT_STATUS_NOTIFY.has("delivered"), "important statuses");
const copy = notificationCopy("shipped", "MQ-1");
assert(copy.title.includes("شحن"), "notify copy");

console.log("order-foundation tests passed");
