/** Client-safe: asks the server to send order_received (no secrets). */
export function notifyOrderWhatsApp(orderNumber: string) {
  if (!orderNumber) return;
  void fetch("/api/whatsapp/notify-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_number: orderNumber }),
  }).catch(() => {
    /* never block checkout */
  });
}
