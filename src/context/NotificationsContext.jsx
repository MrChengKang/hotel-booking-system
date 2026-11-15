import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import useResource from "../hooks/useResource";
import * as api from "../services/notificationApi";

const NotificationsContext = createContext(null);
export function NotificationsProvider({ children }) {
  const { user } = useAuth(), id = user?.id;
  const [revision, setRevision] = useState(0), [pendingOwner, setPendingOwner] = useState(null);
  const [lastCount, setLastCount] = useState(null);
  const current = useRef(id), mounted = useRef(true), locks = useRef(new Set()); current.current = id;
  const count = useResource(id ? `unread:${id}:${revision}` : null, api.getUnreadCount);
  useEffect(() => { if (id && count.status === "ready") setLastCount({ ownerId: id, value: count.data?.unreadCount || 0 }); }, [id, count.status, count.data]);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!id) return;
    const update = () => { if (document.visibilityState !== "hidden") refresh(); };
    const timer = setInterval(update, 60000);
    window.addEventListener("focus", update); window.addEventListener("stay:notifications-changed", update); document.addEventListener("visibilitychange", update);
    return () => { clearInterval(timer); window.removeEventListener("focus", update); window.removeEventListener("stay:notifications-changed", update); document.removeEventListener("visibilitychange", update); };
  }, [id, refresh]);
  async function read(notificationId) {
    if (!id || locks.current.has(id)) return;
    locks.current.add(id); setPendingOwner(id);
    try { if (notificationId == null) await api.markAllNotificationsRead(); else await api.markNotificationRead(notificationId); if (mounted.current && current.current === id) refresh(); }
    finally { locks.current.delete(id); if (mounted.current) setPendingOwner(owner => owner === id ? null : owner); }
  }
  return <NotificationsContext.Provider value={{ user, revision, refresh, count, unreadCount: !id ? 0 : count.data?.unreadCount ?? (lastCount?.ownerId === id ? lastCount.value : 0), busy: id != null && pendingOwner === id, read }}>{children}</NotificationsContext.Provider>;
}
export const useNotifications = () => useContext(NotificationsContext);
