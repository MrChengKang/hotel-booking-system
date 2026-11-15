import { useState } from "react";
import useResource from "../../hooks/useResource";
import { useNotifications } from "../../context/NotificationsContext";
import { getNotifications, notificationTarget } from "../../services/notificationApi";
import RequestState from "../live/RequestState";
import { AccountAccess } from "../account/AccountPage";
import "../layout/NotificationMenu.css";

export function NotificationInbox({ onNavigate, onSelected, compact = false }) {
  const inbox = useNotifications(), [page, setPage] = useState(0), [error, setError] = useState("");
  const resource = useResource(inbox.user ? `inbox:${inbox.user.id}:${inbox.revision}:${page}:${compact}` : null, signal => getNotifications(page, compact ? 5 : 10, signal));
  async function select(item) {
    if (inbox.busy) return; setError("");
    try { if (!item.readAt) await inbox.read(item.id); onSelected?.(); onNavigate(notificationTarget(item.target)); }
    catch (failure) { setError(failure.message); }
  }
  return <><div className="notification-heading"><h2 id={compact ? "notifications-title" : undefined}>Notifications</h2>{inbox.unreadCount > 0 && <button className="notification-mark-all" disabled={inbox.busy} onClick={async () => { setError(""); try { await inbox.read(null); } catch (failure) { setError(failure.message); } }}>Mark all as read</button>}<button className="notification-mark-all" disabled={inbox.busy} onClick={inbox.refresh}>Refresh</button></div>{error && <p role="alert" className="live-error">{error}</p>}<RequestState resource={resource} loading="Loading notifications…" />{resource.status === "ready" && resource.data && <>{!resource.data.items.length && <p className="notification-empty">No notifications yet. Booking and review updates will appear here.</p>}<ul className="notification-list">{resource.data.items.map(item => <li key={item.id}><button disabled={inbox.busy} className={`notification-item${!item.readAt ? " is-unread" : ""}`} aria-label={`${item.title}: ${item.message}. ${item.readAt ? "Read" : "Unread"}.`} onClick={() => select(item)}><span className="notification-event-icon" aria-hidden="true">{item.title.toLowerCase().includes("review") ? "★" : "▧"}</span><span className="notification-copy"><strong>{item.title}</strong><span className="notification-message">{item.message}</span><time className="notification-time" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time></span>{!item.readAt && <span className="notification-unread-dot" aria-hidden="true" />}</button></li>)}</ul>{!compact && resource.data.totalPages > 1 && <div className="live-pagination"><button className="outline-button" disabled={!page} onClick={() => setPage(p => p - 1)}>Previous notifications</button><span>{page + 1} / {resource.data.totalPages}</span><button className="outline-button" disabled={page + 1 >= resource.data.totalPages} onClick={() => setPage(p => p + 1)}>Next notifications</button></div>}</>}{compact && <button className="notification-view-all" onClick={() => { onSelected?.(); onNavigate("/notifications"); }}>View all notifications →</button>}</>;
}
export default function NotificationsPage({ onLogin, onNavigate }) {
  const { user } = useNotifications();
  return <AccountAccess destination="/notifications" onLogin={onLogin}><section className="container account-page notifications-page"><h1>Your inbox</h1><p className="account-muted">Booking and review updates for your account.</p>{user && <NotificationInbox key={user.id} onNavigate={onNavigate} />}</section></AccountAccess>;
}
