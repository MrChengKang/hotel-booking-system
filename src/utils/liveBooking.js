const pending = new Map();
export function hotelToday(timeZone) {
  const parts = new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = name => parts.find(item => item.type === name).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function money(amount, currency, locale = "en-US") {
  return new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "code", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount));
}
export function stayParams(values) {
  return new URLSearchParams(Object.entries(values).filter(([, value]) => value !== "" && value != null)).toString();
}
export function safeReturnPath(value) {
  if (!value || !/^\/(hotel\/[1-9]\d*|account|wishlist|notifications|bookings|host(?:\/(?:hotels|rooms|photos|inventory|bookings|reviews))?|admin(?:\/(?:hotels|users|bookings|refunds))?)(\?[^#]*)?$/.test(value)) return "/";
  return value;
}
export function loginDestination(role, value) {
  const next = safeReturnPath(value);
  if (next === "/account" || next === "/wishlist" || next === "/notifications") return next;
  if (role === "admin") return /^\/admin(?:\/|\?|$)/.test(next) ? next : "/admin";
  if (role === "host") {
    if (/^\/host\/bookings(?:\?|$)/.test(next)) return "/host";
    return /^\/host(?:\/|\?|$)/.test(next) ? next : "/host";
  }
  if (role === "user" && /^\/bookings\?booking=[1-9]\d*&payment=(return|cancelled)$/.test(next)) return next;
  if (role === "user") return /^\/hotel\/[1-9]\d*(?:\?|$)/.test(next) ? next : "/";
  return "/";
}
function pendingKey(userId, draft) {
  return `stay-booking-request:${userId}:${JSON.stringify([draft.roomTypeId, draft.checkIn, draft.checkOut, draft.rooms, draft.guests])}`;
}
export function requestKey(userId, draft) {
  const key = pendingKey(userId, draft);
  let value = pending.get(key);
  try { value = value || sessionStorage.getItem(key); } catch {}
  if (!value || !/^[0-9a-f-]{36}$/i.test(value)) {
    if (window.crypto?.randomUUID) value = window.crypto.randomUUID();
    else if (window.crypto?.getRandomValues) {
      const bytes = window.crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 15) | 64;
      bytes[8] = (bytes[8] & 63) | 128;
      const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
      value = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    } else throw new Error("Secure booking IDs are unavailable. Open STAY using HTTPS or localhost.");
  }
  pending.set(key, value);
  try { sessionStorage.setItem(key, value); } catch {}
  return value;
}
export function finishRequest(userId, draft) {
  const key = pendingKey(userId, draft);
  pending.delete(key);
  try { sessionStorage.removeItem(key); } catch {}
}
