import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { usePreferences } from "../../context/PreferencesContext";
import { getAdminOverview, getAdminUsers } from "../../services/adminApi";
import useResource from "../../hooks/useResource";
import RequestState from "../live/RequestState";
import AdminHotels from "./AdminHotels";
import AdminPager from "./AdminPager";
import AdminBookings from "./AdminBookings";
import AdminRefunds from "./AdminRefunds";
import "./AdminDashboard.css";
import "./AdminBookings.css";

const navigation = [["overview", "Overview", "◈"], ["hotels", "Hotel review", "▦"], ["users", "Users", "♙"], ["bookings", "Bookings", "▤"], ["refunds", "Refund tracking", "↩"]];

export default function AdminDashboard({ view = "overview", params, onNavigate, onLogin, onNotify }) {
  const auth = useAuth();
  const path = `/admin${view === "overview" ? "" : `/${view}`}${params?.toString() ? `?${params}` : ""}`;
  useEffect(() => { if (!auth.loading && !auth.user) onLogin(path); }, [auth.loading, auth.user, onLogin, path]);
  if (auth.loading) return <section className="container admin-access"><p role="status">Checking your account…</p></section>;
  if (!auth.user) return <section className="container admin-access"><h1>Admin Dashboard</h1><button className="dark-button" onClick={() => onLogin(path)}>Sign in as an administrator</button></section>;
  if (auth.user.role !== "admin") return <section className="container admin-access"><h1>Administrator access required</h1><p>This area is available only to platform administrators.</p><button className="outline-button" onClick={() => onNavigate(auth.user.role === "host" ? "/host" : "/")}>Return to your workspace</button></section>;
  return <div className="container admin-shell"><aside className="admin-sidebar"><span className="admin-eyebrow">STAY PLATFORM</span><h2>Admin workspace</h2><p>{auth.user.name}</p><nav aria-label="Admin navigation">{navigation.map(([key, label, symbol]) => <a key={key} href={`/admin${key === "overview" ? "" : `/${key}`}`} aria-current={view === key ? "page" : undefined} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) { event.preventDefault(); onNavigate(`/admin${key === "overview" ? "" : `/${key}`}`); } }}><span aria-hidden="true">{symbol}</span>{label}</a>)}</nav><div className="admin-sidebar-note"><strong>Platform review</strong><p>Hosts submit their hotel. Approve a complete listing before it goes live.</p></div><button className="admin-text" onClick={() => onNavigate("/hotels")}>Browse public hotels ↗</button></aside>
    <div className="admin-main"><div className="admin-heading"><span className="admin-eyebrow">PLATFORM MANAGEMENT</span><h1>{navigation.find(([key]) => key === view)?.[1] || "Overview"}</h1><p>Review hotel listings and monitor the STAY platform.</p></div>{view === "hotels" ? <AdminHotels key={auth.user.id} onNotify={onNotify} /> : view === "users" ? <AdminUsers key={auth.user.id} /> : view === "bookings" ? <AdminBookings key={auth.user.id} userId={auth.user.id} params={params} onNavigate={onNavigate} /> : view === "refunds" ? <AdminRefunds key={auth.user.id} userId={auth.user.id} params={params} onNavigate={onNavigate} /> : <AdminOverview userId={auth.user.id} onNavigate={onNavigate} />}</div>
  </div>;
}

function AdminOverview({ userId, onNavigate }) {
  const resource = useResource(`admin-overview:${userId}`, getAdminOverview);
  const cards = [["Total accounts", "users"], ["Hotel hosts", "hosts"], ["Administrators", "admins"], ["All hotels", "hotels"], ["Awaiting review", "pendingHotels"], ["Published hotels", "publishedHotels"], ["All bookings", "bookings"], ["Pending payments", "pendingPayments"], ["Paid bookings", "paidBookings"], ["Refunded bookings", "refundedBookings"], ["Refunds needing review", "refundsNeedingReview"]];
  const destinations = { pendingHotels: "/admin/hotels", bookings: "/admin/bookings", pendingPayments: "/admin/bookings?status=PENDING_PAYMENT", refundedBookings: "/admin/bookings?paymentStatus=REFUNDED", refundsNeedingReview: "/admin/refunds?status=NEEDS_REVIEW" };
  return <><div className="admin-section-heading"><span className="admin-test-label">STRIPE SANDBOX · TEST DATA</span><button className="outline-button" onClick={resource.reload}>Refresh overview</button></div><RequestState resource={resource} loading="Loading platform overview…" />{resource.status === "ready" && <div className="admin-stat-grid">{cards.map(([label, key]) => destinations[key] ? <button className={`admin-stat admin-stat-link${key === "pendingHotels" ? " is-highlighted" : ""}`} key={key} onClick={() => onNavigate(destinations[key])} aria-label={`View ${label.toLowerCase()}`}><span>{label}</span><strong>{resource.data[key] ?? 0}</strong><small>View records →</small></button> : <article className="admin-stat" key={key}><span>{label}</span><strong>{resource.data[key] ?? 0}</strong></article>)}</div>}<section className="admin-panel admin-review-callout"><div><h2>Ready for the next guest</h2><p>Check the hotel's information, rooms and photos before approving its listing.</p><small>Payment figures describe sandbox activity. They are not real revenue.</small></div><button className="dark-button" onClick={() => onNavigate("/admin/hotels")}>Review hotels</button></section></>;
}

function AdminUsers() {
  const [filters, setFilters] = useState({ page: 0, search: "" });
  const { language } = usePreferences();
  const resource = useResource(JSON.stringify(["admin-users", filters]), signal => getAdminUsers(filters, signal));
  return <section className="admin-panel"><div className="admin-section-heading"><div><h2>Platform accounts</h2><p>View registered guests, hotel hosts and administrators.</p></div><button className="outline-button" onClick={resource.reload}>Refresh users</button></div><form className="admin-filters" onSubmit={event => { event.preventDefault(); setFilters({ page: 0, search: new FormData(event.currentTarget).get("search").trim() }); }}><label>Search accounts<input name="search" placeholder="Name or email" maxLength={100} defaultValue={filters.search} /></label><button className="dark-button">Search users</button></form><RequestState resource={resource} loading="Loading platform users…" />{resource.status === "ready" && <>{!resource.data.items.length ? <p className="admin-empty">No accounts match this search.</p> : <div className="admin-table-scroll"><table className="admin-table"><caption className="admin-sr-only">Platform users</caption><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead><tbody>{resource.data.items.map(user => <tr key={user.id}><td><strong>{user.name}</strong><small>#{user.id}</small></td><td>{user.email}</td><td><span className="admin-badge">{user.role}</span></td><td>{new Date(user.createdAt).toLocaleDateString(language)}</td></tr>)}</tbody></table></div>}<AdminPager data={resource.data} page={filters.page} onPage={page => setFilters(current => ({ ...current, page }))} /></>}<p className="admin-muted">Accounts are read-only in this first phase. Public registration cannot create an administrator.</p></section>;
}
