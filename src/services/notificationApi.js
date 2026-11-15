import { apiRequest, apiMutation } from "./apiClient";
export const getNotifications = (page = 0, size = 10, signal) => apiRequest(`/account/notifications?page=${page}&size=${size}`, { signal });
export const getUnreadCount = signal => apiRequest("/account/notifications/unread-count", { signal });
export const markNotificationRead = id => apiMutation("POST", `/account/notifications/${encodeURIComponent(id)}/read`);
export const markAllNotificationsRead = () => apiMutation("POST", "/account/notifications/read-all");
export function notificationTarget(path) {
  return /^\/(?:bookings\?booking=[1-9]\d*|host\/(?:bookings|reviews)\?hotelId=[1-9]\d*)$/.test(path || "") ? path : "/notifications";
}
