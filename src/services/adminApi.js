import { apiMutation, apiRequest } from "./apiClient";

const query = values => new URLSearchParams(Object.entries(values).filter(([, value]) => value !== "" && value != null)).toString();
const id = value => encodeURIComponent(value);
export const getAdminOverview = signal => apiRequest("/admin/overview", { signal });
export const getAdminUsers = (filters, signal) => apiRequest(`/admin/users?${query({ page: 0, size: 20, ...filters })}`, { signal });
export const getAdminHotels = (filters, signal) => apiRequest(`/admin/hotels?${query({ page: 0, size: 20, ...filters })}`, { signal });
export const getAdminHotel = (hotelId, signal) => apiRequest(`/admin/hotels/${id(hotelId)}`, { signal });
export const decideHotel = (hotelId, values) => apiMutation("POST", `/admin/hotels/${id(hotelId)}/decision`, values);
export const getAdminBookings = (filters, signal) => apiRequest(`/admin/bookings?${query({ page: 0, size: 20, ...filters })}`, { signal });
export const getAdminBooking = (bookingId, signal) => apiRequest(`/admin/bookings/${id(bookingId)}`, { signal });
export const getAdminRefunds = (filters, signal) => apiRequest(`/admin/refunds?${query({ page: 0, size: 20, ...filters })}`, { signal });
