import { getAdminRefunds } from "../../services/adminApi";
import { usePreferences } from "../../context/PreferencesContext";
import useResource from "../../hooks/useResource";
import RequestState from "../live/RequestState";
import AdminPager from "./AdminPager";
import AdminBookingFilters from "./AdminBookingFilters";
import AdminBookingDetails from "./AdminBookingDetails";
import { BookingDetailLink, BookingIdentity, BookingStay, GuestIdentity, RecordStatus } from "./AdminBookingShared";
import { adminBookingPath, adminListPath, originalMoney, readAdminFilters, recordTime, selectedBooking } from "./adminBookingUtils";

export default function AdminRefunds({ userId, params, onNavigate }) {
  const { language } = usePreferences();
  const filters = readAdminFilters(params, true);
  const filterKey = JSON.stringify(filters);
  const resource = useResource(`admin-refunds:${userId}:${filterKey}`, signal => getAdminRefunds(filters, signal));
  const bookingId = selectedBooking(params);
  return <section className="admin-panel">
    <div className="admin-section-heading"><div><h2>Refund tracking</h2><p>Follow current refund records and identify those needing attention.</p></div><button className="outline-button" onClick={resource.reload}>Refresh refunds</button></div>
    <p className="admin-test-label">STRIPE SANDBOX · TEST REFUNDS ONLY</p>
    <AdminBookingFilters key={filterKey} filters={filters} refunds onApply={next => onNavigate(adminListPath("refunds", next))} onReset={() => onNavigate("/admin/refunds")} />
    <p className="admin-muted">Needs review includes failed refunds and records marked for manual review. Processing includes initializing and pending refunds.</p>
    <RequestState resource={resource} loading="Loading refund records…" />
    {resource.status === "ready" && <>
      <p className="admin-muted" role="status">{resource.data.totalElements} {resource.data.totalElements === 1 ? "refund" : "refunds"} match these filters.</p>
      {resource.data.items.length ? <div className="admin-table-scroll"><table className="admin-table admin-booking-table"><caption className="admin-sr-only">Platform refunds</caption><thead><tr><th>Hotel / reference</th><th>Guest</th><th>Check-in → check-out</th><th>Refund status</th><th>Refund amount</th><th>Record updated</th><th>Actions</th></tr></thead><tbody>{resource.data.items.map(({ booking, guest, refund }) => <tr key={refund.id}>
        <td><BookingIdentity booking={booking} /></td><td><GuestIdentity guest={guest} /></td><td><BookingStay booking={booking} /></td><td><RecordStatus value={refund.status} /></td><td className="admin-money">{originalMoney(refund.amountMinor, refund.currencyCode, language, true)}</td><td>{recordTime(refund.updatedAt, language)}</td><td><BookingDetailLink href={adminBookingPath("refunds", params, booking.id)} onOpen={() => onNavigate(adminBookingPath("refunds", params, booking.id))} reference={booking.reference} /></td>
      </tr>)}</tbody></table></div> : <div className="admin-empty"><h3>No refunds match these filters</h3><p>Choose all statuses to inspect processing and completed refunds.</p></div>}
      <AdminPager data={resource.data} page={filters.page} onPage={page => onNavigate(adminListPath("refunds", { ...filters, page }))} />
    </>}
    <p className="admin-muted">This view shows the current saved refund record, not an event history. It does not issue, retry or approve refunds.</p>
    {bookingId && <AdminBookingDetails key={bookingId} userId={userId} id={bookingId} onClose={() => onNavigate(adminBookingPath("refunds", params, null))} />}
  </section>;
}
