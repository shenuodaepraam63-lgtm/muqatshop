/** Status → customer notification copy */

export const IMPORTANT_STATUS_NOTIFY = new Set([
  "confirmed",
  "processing",
  "preparing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "rejected",
]);

export function notificationCopy(status: string, orderNumber: string): {
  title: string;
  body: string;
} {
  const n = orderNumber;
  switch (status) {
    case "confirmed":
      return { title: "تم تأكيد طلبك", body: `الطلب ${n} تم تأكيده وجارٍ تجهيزه.` };
    case "processing":
    case "preparing":
      return { title: "قيد التجهيز", body: `الطلب ${n} قيد التجهيز الآن.` };
    case "shipped":
      return { title: "تم شحن طلبك", body: `الطلب ${n} خرج للشحن.` };
    case "out_for_delivery":
      return { title: "خرج للتسليم", body: `الطلب ${n} في الطريق إليك.` };
    case "delivered":
      return { title: "تم التسليم", body: `الطلب ${n} تم تسليمه بنجاح.` };
    case "cancelled":
      return { title: "تم إلغاء الطلب", body: `الطلب ${n} تم إلغاؤه.` };
    case "rejected":
      return { title: "تم رفض الطلب", body: `الطلب ${n} لم يُقبل.` };
    default:
      return { title: "تحديث الطلب", body: `تم تحديث حالة الطلب ${n}.` };
  }
}
