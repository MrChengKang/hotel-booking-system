import { useCallback, useEffect, useState } from "react";
import { destinations } from "../data/destinations";

const readPath = () => window.location.pathname + window.location.search;
export default function useDestinationRoute() {
  const [path, setPath] = useState(readPath);
  useEffect(() => {
    const update = () => setPath(readPath());
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  const navigatePath = useCallback(next => {
    window.history.pushState({}, "", next);
    setPath(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  const url = new URL(path, window.location.origin);
  const pathname = url.pathname.replace(/\/$/, "") || "/";
  const authMode = pathname.match(/^\/(login|register|forgot-password|reset-password)$/)?.[1];
  const hostView = pathname === "/host" ? "overview" : pathname.match(/^\/host\/(hotels|rooms|photos|inventory|bookings|reviews)$/)?.[1];
  const adminView = pathname === "/admin" ? "overview" : pathname.match(/^\/admin\/(hotels|users|bookings|refunds)$/)?.[1];
  const hotelId = pathname.match(/^\/hotel\/([1-9]\d*)$/)?.[1];
  const citySlug = pathname.match(/^\/hotels\/([^/]+)$/)?.[1];
  const destination = destinations.find(item => item.slug === citySlug);
  const kind = pathname === "/notifications" ? "notifications" : pathname === "/account" ? "account" : pathname === "/wishlist" ? "wishlist" : authMode ? "auth" : adminView ? "admin" : hostView ? "host" : hotelId ? "hotel" : pathname === "/bookings" ? "bookings" : pathname === "/hotels" || destination ? "hotels" : pathname === "/" ? "home" : "not-found";
  return { kind, authMode, hostView, adminView, hotelId, params: url.searchParams, city: url.searchParams.get("city") || destination?.name.split(",")[0] || "", path, navigatePath };
}
