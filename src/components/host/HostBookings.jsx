import { bookingStatus } from "../../utils/payment";
import { useState } from "react";
import { getHostBookings } from "../../services/hostApi";
import useResource from "../../hooks/useResource";
import { usePreferences } from "../../context/PreferencesContext";
import { money } from "../../utils/liveBooking";
import RequestState from "../live/RequestState";
import Modal from "../common/Modal";
import { HostPager } from "./HostForm";

export default function HostBookings({ hotel }) {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const { language } = usePreferences();
  const resource = useResource(`host-bookings:${hotel.id}:${page}`, signal => getHostBookings(hotel.id, page, signal));
  return <section className="host-panel"><div className="host-section-head"><div><h2>Hotel bookings</h2><p>{hotel.name} · {resource.data?.totalElements ?? "—"} orders</p></div><button className="outline-button" onClick={resource.reload}>Refresh orders</button></div><p className="host-muted">Pending payments hold rooms temporarily. Only server-confirmed payments mark a reservation as paid. Guests manage eligible cancellations from My Bookings.</p><RequestState resource={resource} loading="Loading hotel orders…" />
    {resource.status === "ready" && resource.data.items.length === 0 && <div className="host-empty"><h3>No bookings yet</h3><p>Published hotels with active room types and complete daily inventory can receive reservations.</p></div>}
    {resource.status === "ready" && <div className="host-table-scroll"><table className="host-table"><caption className="host-sr-only">Bookings for {hotel.name}</caption><thead><tr><th>Guest / reference</th><th>Room type</th><th>Stay</th><th>Rooms / guests</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>{resource.data.items.map(order => <tr key={order.booking.id}><td><strong>{order.guestName}</strong><small className="host-reference">{order.booking.reference}</small></td><td>{order.booking.roomName}</td><td>{order.booking.checkIn}<br />{order.booking.checkOut}</td><td>{order.booking.rooms} / {order.booking.guests}</td><td>{money(order.booking.total, order.booking.currencyCode, language)}</td><td><span className={`host-badge ${order.booking.status === "CANCELLED" ? "status-draft" : "status-published"}`}>{order.booking.status}</span><small className="host-reference">{order.booking.paymentStatus}</small></td><td><button className="host-text" aria-label={`View order ${order.booking.reference}`} onClick={() => setSelected(order)}>Details</button></td></tr>)}</tbody></table></div>}
    <HostPager data={resource.data} page={page} onChange={setPage} />
    {selected && <Modal title="Hotel order details" onClose={() => setSelected(null)}><div className="host-order-detail"><h3>{selected.guestName}</h3><p>{selected.booking.reference}</p><dl><div><dt>Hotel</dt><dd>{selected.booking.hotelName}</dd></div><div><dt>Room</dt><dd>{selected.booking.roomName}</dd></div><div><dt>Dates</dt><dd>{selected.booking.checkIn} – {selected.booking.checkOut}</dd></div><div><dt>Rooms / guests</dt><dd>{selected.booking.rooms} / {selected.booking.guests}</dd></div><div><dt>Status</dt><dd>{bookingStatus(selected.booking)}</dd></div><div><dt>Total</dt><dd>{money(selected.booking.total, selected.booking.currencyCode, language)}</dd></div><div><dt>Created</dt><dd>{new Date(selected.booking.createdAt).toLocaleString(language)}</dd></div>{selected.booking.cancelledAt && <div><dt>Cancelled</dt><dd>{new Date(selected.booking.cancelledAt).toLocaleString(language)}</dd></div>}</dl><p className="host-muted">Order details are read-only. No payment or refund action is available here.</p></div></Modal>}
  </section>;
}
