import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getHostHotel, getHostHotels, getHostOverview } from "../../services/hostApi";
import useResource from "../../hooks/useResource";
import RequestState from "../live/RequestState";
import HostHotels from "./HostHotels";
import HostRooms from "./HostRooms";
import HostPhotos from "./HostPhotos";
import HostInventory from "./HostInventory";
import HostReviews from "./HostReviews";
import HostBookings from "./HostBookings";
import { HostPager } from "./HostForm";
import "./HostDashboard.css";

const views = [["overview", "Overview", "◈"], ["hotels", "Hotels", "▦"], ["rooms", "Room types", "▤"], ["photos", "Photos", "▧"], ["inventory", "Daily inventory", "▥"], ["bookings", "Bookings", "▧"], ["reviews", "Reviews", "★"]];

export default function HostDashboard({ view, params, onNavigate, onLogin, onNotify }) {
  const auth = useAuth();
  useEffect(() => { if (!auth.loading && !auth.user) onLogin(`/host${view === "overview" ? "" : `/${view}`}${params.toString() ? `?${params}` : ""}`); }, [auth.loading, auth.user, onLogin, params, view]);
  if (auth.loading) return <section className="container host-access"><p role="status">Checking your account…</p></section>;
  if (!auth.user) return <section className="container host-access"><h1>Host Dashboard</h1><button className="host-primary" onClick={() => onLogin("/host")}>Sign in to manage hotels</button></section>;
  if (auth.user.role !== "host") return <section className="container host-access"><h1>Host access required</h1><p>This dashboard is available to Hotel Host accounts. Your current role is {auth.user.role}.</p><button className="outline-button" onClick={() => onNavigate("/hotels")}>Browse hotels</button></section>;
  return <Workspace key={auth.user.id} user={auth.user} view={view} params={params} onNavigate={onNavigate} onNotify={onNotify} />;
}

function Workspace({ user, view, params, onNavigate, onNotify }) {
  const [page, setPage] = useState(0);
  const collection = useResource(`host-hotels:${user.id}:${page}`, signal => getHostHotels(page, signal));
  const hotelId = params.get("hotelId") || collection.data?.items[0]?.id;
  const needsHotel = ["rooms", "photos", "inventory", "bookings", "reviews"].includes(view);
  const hotel = useResource(needsHotel && hotelId ? `host-hotel:${user.id}:${hotelId}` : null, signal => getHostHotel(hotelId, signal));
  function navigate(next, id = hotelId, roomId) {
    const query = new URLSearchParams();
    if (id && !["overview", "hotels"].includes(next)) query.set("hotelId", id);
    if (roomId) query.set("roomId", roomId);
    onNavigate(`/host${next === "overview" ? "" : `/${next}`}${query.toString() ? `?${query}` : ""}`);
  }
  const allItems = collection.data?.items || [];
  const selectorHotels = hotel.data && !allItems.some(item => String(item.id) === String(hotel.data.id)) ? [hotel.data, ...allItems] : allItems;
  return <div className="host-shell container"><aside className="host-sidebar"><span className="host-eyebrow">STAY PARTNER</span><h2>Host workspace</h2><p>{user.name}</p><nav aria-label="Host navigation">{views.map(([key, label, symbol]) => <a key={key} href={`/host${key === "overview" ? "" : `/${key}`}`} aria-current={view === key ? "page" : undefined} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) { event.preventDefault(); navigate(key); } }}><span aria-hidden="true">{symbol}</span>{label}</a>)}</nav><div className="host-sidebar-note"><strong>Ready for your first guest?</strong><p>Create a hotel → add rooms and photos → initialize dates → submit for review.</p></div><button className="host-text" onClick={() => onNavigate("/hotels")}>Browse public hotels ↗</button></aside>
    <div className="host-main"><div className="host-page-heading"><span className="host-eyebrow">HOTEL MANAGEMENT</span><h1>{views.find(item => item[0] === view)?.[1]}</h1><p>Manage your properties, availability and reservations.</p></div>
      {view === "overview" ? <HostOverview userId={user.id} onNavigate={navigate} /> : view === "hotels" ? <HostHotels resource={collection} page={page} onPage={setPage} onChoose={(id, next) => navigate(next, id)} onNotify={onNotify} onRefresh={collection.reload} /> : <>
        <RequestState resource={collection} loading="Loading your hotel selector…" />
        {collection.status === "ready" && <div className="host-hotel-picker"><label className="host-field">Selected hotel<select aria-label="Selected hotel" value={hotelId || ""} onChange={event => navigate(view, event.target.value)}><option value="" disabled>Select your hotel</option>{selectorHotels.map(item => <option key={item.id} value={item.id}>{item.name} · {item.reviewStatus === "PENDING" ? "AWAITING REVIEW" : item.status}</option>)}</select></label><HostPager data={collection.data} page={page} onChange={setPage} /></div>}
        {collection.status === "ready" && !hotelId && <div className="host-panel host-empty"><h2>No hotels yet</h2><p>Create your first hotel before managing rooms, inventory or bookings.</p><button className="host-primary" onClick={() => navigate("hotels")}>Add a hotel</button></div>}
        <RequestState resource={hotel} loading="Loading selected hotel…" />
        {hotel.status === "ready" && hotel.data.reviewStatus === "PENDING" && <p className="host-notice">This submission is awaiting review. Hotel details, rooms, photos and inventory are read-only. Withdraw it from Hotels before making changes.</p>}
        {hotel.status === "ready" && (view === "rooms" ? <HostRooms key={hotel.data.id} hotel={hotel.data} onNotify={onNotify} onInventory={roomId => navigate("inventory", hotel.data.id, roomId)} onPhotos={roomId => navigate("photos", hotel.data.id, roomId)} /> : view === "photos" ? <HostPhotos key={hotel.data.id} hotel={hotel.data} roomId={params.get("roomId")} onRoomChange={roomId => navigate("photos", hotel.data.id, roomId)} onNotify={onNotify} /> : view === "inventory" ? <HostInventory key={hotel.data.id} hotel={hotel.data} roomId={params.get("roomId")} onRoomChange={roomId => navigate("inventory", hotel.data.id, roomId)} onNotify={onNotify} /> : view === "reviews" ? <HostReviews key={hotel.data.id} hotel={hotel.data} onNotify={onNotify} /> : <HostBookings key={hotel.data.id} hotel={hotel.data} />)}
      </>}
    </div></div>;
}

function HostOverview({ userId, onNavigate }) {
  const resource = useResource(`host-overview:${userId}`, signal => getHostOverview(signal));
  return <><RequestState resource={resource} loading="Loading host overview…" />{resource.status === "ready" && <div className="host-stat-grid">{[["Your hotels", resource.data.hotels], ["Published hotels", resource.data.publishedHotels], ["Total bookings", resource.data.bookings], ["Confirmed bookings", resource.data.confirmedBookings]].map(([label, value]) => <article className="host-stat" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>}<section className="host-panel"><div className="host-section-head"><div><h2>Build your next great stay</h2><p>Your hotel goes live only after administrator approval.</p></div><button className="outline-button" onClick={resource.reload}>Refresh overview</button></div><div className="host-steps">{[["01", "Create your hotel", "Add its location, currency and local time zone.", "hotels"], ["02", "Set up room types", "Define capacity, actual room count and base rates.", "rooms"], ["03", "Open your dates", "Initialize nightly inventory and adjust daily prices.", "inventory"]].map(([number, title, body, target]) => <button key={number} onClick={() => onNavigate(target)}><span>{number}</span><h3>{title}</h3><p>{body}</p><strong>Manage →</strong></button>)}</div><p className="host-muted">Sandbox payment confirms new reservations. Unpaid room holds expire; production payment collection and revenue reporting are not enabled.</p></section></>;
}
