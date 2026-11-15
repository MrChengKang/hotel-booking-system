import { apiRequest as request, apiPost as post } from "./apiClient";
export { ApiError } from "./apiClient";

export async function readCurrentUser() {
  try { return await request("/auth/me"); }
  catch (error) { if (error.status === 401) return null; throw error; }
}
export const login = (email, password, rememberMe = false) => post("/auth/login", { email, password, rememberMe });
export const register = ({ name, email, password, role }) => post("/auth/register", { name, email, password, role });
export const logout = () => post("/auth/logout");
export const forgotPassword = email => post("/auth/forgot-password", { email });
export const resetPassword = (token, password) => post("/auth/reset-password", { token, password });
