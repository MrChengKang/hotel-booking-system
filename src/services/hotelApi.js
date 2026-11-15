import { apiRequest, apiPost } from "./apiClient";
const query = values => new URLSearchParams(Object.entries(values).filter(([, v]) => v !== "" && v != null)).toString();
export const getHotels = (values = {}, signal) => apiRequest(`/hotels?${query({ page: 0, size: 12, ...values })}`, { signal });
export const getHotel = (id, signal) => apiRequest(`/hotels/${encodeURIComponent(id)}`, { signal });
export const getRoomTypes = (id, signal) => apiRequest(`/hotels/${encodeURIComponent(id)}/room-types`, { signal });
export const getHotelImages = (id, roomTypeId, signal) => apiRequest(`/hotels/${encodeURIComponent(id)}/images${roomTypeId ? `?${query({ roomTypeId })}` : ""}`, { signal });
export const getAvailability = (id, values, signal) => apiRequest(`/hotels/${encodeURIComponent(id)}/availability?${query(values)}`, { signal });
export const createBooking = values => apiPost("/bookings", values);
export const getBookings = (page = 0, signal) => apiRequest(`/bookings?${query({ page, size: 10 })}`, { signal });
export const getBooking = (id, signal) => apiRequest(`/bookings/${encodeURIComponent(id)}`, { signal });
export const cancelBooking = id => apiPost(`/bookings/${encodeURIComponent(id)}/cancel`);

export const getHotelDestinations = signal => apiRequest("/hotels/destinations", { signal });
