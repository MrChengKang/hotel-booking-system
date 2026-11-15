import { apiRequest, apiMutation } from "./apiClient";
export const getPaymentConfig = signal => apiRequest("/payments/config", { signal });
export const getBookingPayment = (id, signal) => apiRequest(`/bookings/${encodeURIComponent(id)}/payment`, { signal });
export const startCheckout = id => apiMutation("POST", `/bookings/${encodeURIComponent(id)}/checkout`);
export const getCancellation = (id, signal) => apiRequest(`/bookings/${encodeURIComponent(id)}/cancellation`, { signal });
export const requestRefund = (id, expectedAmount) => apiMutation("POST", `/bookings/${encodeURIComponent(id)}/refund`, { expectedAmount });
export function checkoutUrl(value) {
  try { const url = new URL(value); if (url.protocol === "https:" && url.hostname === "checkout.stripe.com" && !url.username && !url.password && !url.port) return url.href; } catch {}
  throw new Error("The payment server returned an invalid checkout link.");
}
export function redirectToCheckout(value) { window.location.assign(checkoutUrl(value)); }
