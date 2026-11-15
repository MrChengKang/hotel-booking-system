export const bookingStatuses = ["PENDING_PAYMENT", "CONFIRMED", "CANCELLED", "EXPIRED"];
export const paymentStatuses = ["UNPAID", "NOT_REQUIRED", "PAID", "REVIEW_REQUIRED", "REFUND_PENDING", "REFUND_FAILED", "REFUNDED"];
export const refundStatuses = ["NEEDS_REVIEW", "PROCESSING", "INITIALIZING", "PENDING", "SUCCEEDED", "FAILED", "REVIEW_REQUIRED"];
export const statusLabel = value => value ? value.toLowerCase().replace(/_/g, " ").replace(/^./, first => first.toUpperCase()) : "Not recorded";

function dateFilter(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : "";
}
export function readAdminFilters(params, refunds = false) {
  const query = new URLSearchParams(params);
  const page = Number(query.get("page"));
  const size = Number(query.get("size") || 20);
  const result = {
    page: Number.isSafeInteger(page) && page >= 0 ? page : 0,
    size: Number.isInteger(size) && size >= 1 && size <= 100 ? size : 20,
    search: (query.get("search") || "").slice(0, 254),
    hotel: (query.get("hotel") || "").slice(0, 160),
    status: refunds ? (query.get("status") === "ALL" ? "" : refundStatuses.includes(query.get("status")) ? query.get("status") : "NEEDS_REVIEW") : (bookingStatuses.includes(query.get("status")) ? query.get("status") : ""),
    checkInFrom: dateFilter(query.get("checkInFrom")),
    checkInTo: dateFilter(query.get("checkInTo")),
  };
  if (!refunds) result.paymentStatus = paymentStatuses.includes(query.get("paymentStatus")) ? query.get("paymentStatus") : "";
  if (/^[1-9]\d*$/.test(query.get("hotelId") || "")) result.hotelId = query.get("hotelId");
  return result;
}
export function adminListPath(view, filters) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== "" && value != null && !(key === "page" && value === 0) && !(key === "size" && value === 20)) query.set(key, value); });
  if (view === "refunds" && !filters.status) query.set("status", "ALL");
  return `/admin/${view}${query.toString() ? `?${query}` : ""}`;
}
export function adminBookingPath(view, params, id) {
  const query = new URLSearchParams(params);
  if (id) query.set("booking", id); else query.delete("booking");
  return `/admin/${view}${query.toString() ? `?${query}` : ""}`;
}
export function selectedBooking(params) {
  const value = new URLSearchParams(params).get("booking");
  return /^[1-9]\d*$/.test(value || "") ? value : null;
}
export function originalMoney(amount, currency, locale = "en-US", minor = false) {
  if (amount == null) return "Not recorded";
  const formatter = new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "code" });
  const digits = formatter.resolvedOptions().maximumFractionDigits;
  return formatter.format(Number(amount) / (minor ? 10 ** digits : 1));
}
export function recordTime(value, locale = "en-US") {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString(locale) : "Not recorded";
}
