/** Shared types for permanent order foundation (events + shipments + version). */

export type OrderActorType = "system" | "admin" | "customer" | "merchant";

export type OrderStatusEvent = {
  id: string;
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
  actorType: OrderActorType;
  actorId: string | null;
  note: string | null;
  createdAt: string;
};

export type OrderShipment = {
  id: string;
  orderId: string;
  label: string;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  sortOrder: number;
  shippedAt: string | null;
  deliveredAt: string | null;
  updatedAt: string;
};

export function mapStatusEvent(row: Record<string, unknown>): OrderStatusEvent {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    fromStatus: row.from_status != null ? String(row.from_status) : null,
    toStatus: String(row.to_status),
    actorType: (row.actor_type as OrderActorType) || "system",
    actorId: row.actor_id != null ? String(row.actor_id) : null,
    note: row.note != null ? String(row.note) : null,
    createdAt: String(row.created_at),
  };
}

export function mapShipment(row: Record<string, unknown>): OrderShipment {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    label: String(row.label || "الشحنة الرئيسية"),
    status: String(row.status || "new"),
    carrier: row.carrier != null ? String(row.carrier) : null,
    trackingNumber: row.tracking_number != null ? String(row.tracking_number) : null,
    sortOrder: Number(row.sort_order) || 0,
    shippedAt: row.shipped_at != null ? String(row.shipped_at) : null,
    deliveredAt: row.delivered_at != null ? String(row.delivered_at) : null,
    updatedAt: String(row.updated_at || row.created_at),
  };
}
