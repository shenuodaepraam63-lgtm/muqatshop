/**
 * Foundation unit tests — no network.
 * Run: npm run test:security-unit
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapShipment, mapStatusEvent } from "./order-foundation.ts";
import { notificationCopy, IMPORTANT_STATUS_NOTIFY } from "./order-status-labels.ts";

describe("order-foundation", () => {
  it("maps status events", () => {
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
    assert.equal(ev.toStatus, "confirmed");
    assert.equal(ev.orderId, "o1");
  });

  it("maps shipments", () => {
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
    assert.equal(sh.trackingNumber, "T1");
  });

  it("notification copy for important statuses", () => {
    assert.equal(IMPORTANT_STATUS_NOTIFY.has("delivered"), true);
    const copy = notificationCopy("shipped", "MQ-1");
    assert.ok(copy && (copy.title || copy.body));
  });
});
