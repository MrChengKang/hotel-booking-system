export function apiBaseUrl(value = process.env.REACT_APP_API_URL, mode = process.env.NODE_ENV) {
  return (value?.trim() || (mode === "production" ? "/api" : "http://localhost:8080/api")).replace(/\/$/, "");
}
const API_URL = apiBaseUrl();
export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}
export async function apiRequest(path, options = {}) {
  let response;
  try { response = await fetch(`${API_URL}${path}`, { ...options, credentials: "include" }); }
  catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError("Cannot reach the server. Check that the Spring Boot backend is running.", 0);
  }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/me") window.dispatchEvent(new Event("stay:session-expired"));
    throw new ApiError(data?.message || "The request failed. Please try again.", response.status);
  }
  if (response.status !== 204 && data === null) throw new ApiError("The server returned an invalid response. Please try again.", response.status);
  return data;
}
export async function apiPost(path, body) {
  return apiMutation("POST", path, body);
}
export async function apiMutation(method, path, body) {
  const csrf = await apiRequest("/auth/csrf");
  const result = await apiRequest(path, {
    method, headers: { "Content-Type": "application/json", [csrf.headerName]: csrf.token },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (/^\/bookings(?:\/|$)/.test(path) || /^\/host\/hotels\/\d+\/reviews\//.test(path)) window.dispatchEvent(new Event("stay:notifications-changed"));
  return result;
}
export async function apiUpload(path, body) {
  const csrf = await apiRequest("/auth/csrf");
  return apiRequest(path, { method: "POST", headers: { [csrf.headerName]: csrf.token }, body });
}
export function mediaUrl(path) {
  if (!/^\/api\/media\/[1-9]\d*$/.test(path || "")) return "";
  return `${API_URL.replace(/\/api$/, "")}${path}`;
}
export function avatarUrl(path) {
  if (!/^\/api\/account\/avatar\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(path || "")) return "";
  return `${API_URL.replace(/\/api$/, "")}${path}`;
}
