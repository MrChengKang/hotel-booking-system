import { apiRequest, apiMutation, apiUpload } from "./apiClient";
export const getProfile = signal => apiRequest("/account/profile", { signal });
export const updateProfile = values => apiMutation("PUT", "/account/profile", values);
export const getFavorites = signal => apiRequest("/account/favorites", { signal });
export const saveFavorite = hotelId => apiMutation("PUT", `/account/favorites/${encodeURIComponent(hotelId)}`);
export const removeFavorite = hotelId => apiMutation("DELETE", `/account/favorites/${encodeURIComponent(hotelId)}`);
export const uploadAvatar = file => { const data = new FormData(); data.append("file", file); return apiUpload("/account/avatar", data); };
export const removeAvatar = () => apiMutation("DELETE", "/account/avatar");
