import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import useResource from "../hooks/useResource";
import * as api from "../services/accountApi";

const FavoritesContext = createContext(null);
export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const ownerId = user?.id;
  const resource = useResource(user ? `favorites:${user.id}` : null, api.getFavorites);
  const [override, setOverride] = useState(null), [pendingKeys, setPendingKeys] = useState([]);
  const locks = useRef(new Map()), mounted = useRef(true), owner = useRef(ownerId);
  owner.current = ownerId;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { setOverride(null); setPendingKeys([]); }, [ownerId]);
  const current = !user ? [] : override?.ownerId === ownerId ? override.items : resource.data || [];
  const pending = pendingKeys.filter(key => key.startsWith(`${ownerId}:`)).map(key => Number(key.split(":")[1]));
  const ready = Boolean(user) && resource.status === "ready";
  async function setSaved(hotelId, saved) {
    if (!user || !ready) throw new Error("Wait for your saved hotels to load, then try again.");
    const key = `${ownerId}:${hotelId}`, token = Symbol();
    if (locks.current.has(key)) return;
    locks.current.set(key, token); setPendingKeys(Array.from(locks.current.keys()));
    try {
      const result = saved ? await api.saveFavorite(hotelId) : await api.removeFavorite(hotelId);
      if (mounted.current && owner.current === ownerId) setOverride(previous => {
        const next = (previous?.ownerId === ownerId ? previous.items : current).filter(item => item.hotelId !== hotelId);
        return { ownerId, items: saved ? [result, ...next] : next };
      });
    } finally { if (locks.current.get(key) === token) locks.current.delete(key); if (mounted.current) setPendingKeys(Array.from(locks.current.keys())); }
  }
  function reload() { if (!pending.length) { setOverride(null); resource.reload(); } }
  return <FavoritesContext.Provider value={{ items: current, ready, pending, setSaved, resource: { ...resource, reload }, savedHotels: current.map(item => item.hotel || { id: item.hotelId }), isSaved: id => current.some(item => item.hotelId === id) }}>{children}</FavoritesContext.Provider>;
}
export const useFavorites = () => useContext(FavoritesContext);
