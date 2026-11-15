import { getAdminBookings } from "../../services/adminApi";
import { usePreferences } from "../../context/PreferencesContext";
import useResource from "../../hooks/useResource";
import RequestState from "../live/RequestState";
import AdminPager from "./AdminPager";
import AdminBookingFilters from "./AdminBookingFilters";
import AdminBookingDetails from "./AdminBookingDetails";
import { BookingDetailLink, BookingIdentity, BookingStay, GuestIdentity, RecordStatus } from "./AdminBookingShared";
import { adminBookingPath, adminListPath, originalMoney, readAdminFilters, selectedBooking } from "./adminBookingUtils";

export default function AdminBookings({ userId, params, onNavigate }) {
  const { language } = usePreferences();
  const filters = readAdminFilters(params);
  const filterKey = JSON.stringify(filters);
  const resource = useResource(`admin-bookings:${userId}:${filterKey}`, signal => getAdminBookings(filters, signal));
  const bookingId = selectedBooking(params);
  const open = id => onNavigate(adminBookingPath("bookings", params, id));
  return <section className="admin-panel">
    <div className="admin-section-heading"><div><h2>Platform bookings</h2><p>Inspect reservations, their payment records and refund progress.</p></div><button className="outline-button" onClick={resource.reload}>Refresh bookings</button></div>
    <p className="admin-test-label">STRIPE SANDBOX · TEST PAYMENTS ONLY</p>
    <AdminBookingFilters key={filterKey} filters={filters} onApply={next => onNavigate(adminListPath("bookings", next))} onReset={() => onNavigate("/admin/bookings")} />
    <RequestState resource={resource} loading="Loading platform bookings…" />
    {resource.status === "ready" && <>
      <p className="admin-muted" role="status">{resource.data.totalElements} {resource.data.totalElements === 1 ? "booking" : "bookings"} match these filters.</p>
      {resource.data.items.length ? <div className="admin-table-scroll"><table className="admin-table admin-booking-table"><caption className="admin-sr-only">Platform bookings</caption><thead><tr><th>Hotel / reference</th><th>Guest</th><th>Check-in → check-out</th><th>Booking / payment</th><th>Total</th><th>Refund</th><th>Actions</th></tr></thead><tbody>{resource.data.items.map(({ booking, guest, refundStatus }) => <tr key={booking.id}>
        <td><BookingIdentity booking={booking} /></td><td><GuestIdentity guest={guest} /></td><td><BookingStay booking={booking} /></td><td><RecordStatus value={booking.status} /><div className="admin-status-stack"><RecordStatus value={booking.paymentStatus} /></div></td><td className="admin-money">{originalMoney(booking.total, booking.currencyCode, language)}</td><td><RecordStatus value={refundStatus} /></td><td><BookingDetailLink href={adminBookingPath("bookings", params, booking.id)} onOpen={() => open(booking.id)} reference={booking.reference} /></td>
      </tr>)}</tbody></table></div> : <div className="admin-empty"><h3>No bookings match these filters</h3><p>Try another reference, guest email or date range.</p></div>}
      <AdminPager data={resource.data} page={filters.page} onPage={page => onNavigate(adminListPath("bookings", { ...filters, page }))} />
    </>}
    <p className="admin-muted">Read-only records. Amounts retain each booking's original currency. No payment or cancellation actions are available here.</p>
    {bookingId && <AdminBookingDetails key={bookingId} userId={userId} id={bookingId} onClose={() => onNavigate(adminBookingPath("bookings", params, null))} />}
  </section>;
}
