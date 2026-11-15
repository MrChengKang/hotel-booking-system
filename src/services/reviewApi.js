import { apiRequest, apiMutation } from "./apiClient";
export const getHotelReviews = (id, page = 0, signal) => apiRequest(`/hotels/${encodeURIComponent(id)}/reviews?page=${page}&size=5`, { signal });
export const getBookingReview = (id, signal) => apiRequest(`/bookings/${encodeURIComponent(id)}/review`, { signal });
export const saveBookingReview = (id, values) => apiMutation("PUT", `/bookings/${encodeURIComponent(id)}/review`, values);
export const getHostReviews = (id, page = 0, signal) => apiRequest(`/host/hotels/${encodeURIComponent(id)}/reviews?page=${page}&size=10`, { signal });
export const replyToReview = (hotelId, reviewId, reply) => apiMutation("PUT", `/host/hotels/${encodeURIComponent(hotelId)}/reviews/${encodeURIComponent(reviewId)}/reply`, { reply });

export const getReviewHighlights = signal => apiRequest("/hotels/review-highlights", { signal });
