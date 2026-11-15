import { createContext, useContext, useEffect, useState } from "react";
import * as api from "../services/authApi";

import { updateProfile, uploadAvatar, removeAvatar } from "../services/accountApi";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  useEffect(() => {
    let active = true;
    api.readCurrentUser().then(result => { if (active) setUser(result); })
      .catch(error => { if (active) setSessionError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const expire = () => { setUser(null); setSessionError("Your session expired. Please sign in again."); };
    window.addEventListener("stay:session-expired", expire);
    return () => window.removeEventListener("stay:session-expired", expire);
  }, []);
  const value = {
    user, loading, sessionError,
    async login(email, password, rememberMe = false) { const result = await api.login(email, password, rememberMe); setUser(result); setSessionError(""); return result; },
    async register(values) { const result = await api.register(values); setUser(result); setSessionError(""); return result; },
    async updateProfile(values) {
      const accountId = user?.id;
      const result = await updateProfile(values);
      setUser(current => current?.id === accountId ? { ...current, name: result.name } : current);
      return result;
    },
    async logout() { await api.logout(); setUser(null); },
    async uploadAvatar(file) {
      const accountId = user?.id;
      const result = await uploadAvatar(file);
      setUser(current => current?.id === accountId ? { ...current, avatarUrl: result.avatarUrl } : current);
      return result;
    },
    async removeAvatar() {
      const accountId = user?.id;
      await removeAvatar();
      setUser(current => current?.id === accountId ? { ...current, avatarUrl: null } : current);
    },
    async resetPassword(token, password) { await api.resetPassword(token, password); setUser(null); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
