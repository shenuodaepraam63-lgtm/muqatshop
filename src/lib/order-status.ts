/** Customer-facing order status labels (MQ-CUSTOMER). */

export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: "تم استلام الطلب",
  confirmed: "تم تأكيد الطلب",
  processing: "قيد التجهيز",
  preparing: "قيد التجهيز",
  shipped: "تم الشحن",
  out_for_delivery: "خرج للتسليم",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  rejected: "مرفوض",
  returned: "مرتجع",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] || status;
}

export function orderStatusTone(status: string): string {
  switch (status) {
    case "delivered":
      return "bg-[#EFF8F6] text-[#21865B] border-[#C8E9E4]";
    case "cancelled":
    case "rejected":
      return "bg-red-50 text-[#D64C4C] border-red-100";
    case "shipped":
    case "out_for_delivery":
      return "bg-[#EEF3FF] text-[#3157D5] border-[#D9E4FF]";
    case "confirmed":
    case "processing":
    case "preparing":
      return "bg-amber-50 text-amber-800 border-amber-100";
    default:
      return "bg-[#F6F8FB] text-[#526174] border-[#E4E9F0]";
  }
}

/** Stages for simple timeline (account order detail). */
export const ORDER_TIMELINE: { key: string; label: string }[] = [
  { key: "new", label: "تم استلام الطلب" },
  { key: "confirmed", label: "تم تأكيد الطلب" },
  { key: "processing", label: "قيد التجهيز" },
  { key: "shipped", label: "تم الشحن" },
  { key: "delivered", label: "تم التسليم" },
];

export function timelineIndex(status: string): number {
  const map: Record<string, number> = {
    new: 0,
    confirmed: 1,
    processing: 2,
    preparing: 2,
    shipped: 3,
    out_for_delivery: 3,
    delivered: 4,
    cancelled: -1,
    rejected: -1,
  };
  return map[status] ?? 0;
}
