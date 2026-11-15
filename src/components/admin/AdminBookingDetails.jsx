import { getAdminBooking } from "../../services/adminApi";
import { usePreferences } from "../../context/PreferencesContext";
import useResource from "../../hooks/useResource";
import Modal from "../common/Modal";
import RequestState from "../live/RequestState";
import { RecordStatus } from "./AdminBookingShared";
import { originalMoney, recordTime } from "./adminBookingUtils";

const refundMessages = {
  INITIALIZING: "The refund request is being initialized. Refresh to read its latest saved status.",
  PENDING: "The refund is processing. Its final result has not been recorded yet.",
  SUCCEEDED: "The sandbox refund succeeded. No real money was returned.",
  FAILED: "The refund failed and needs platform follow-up.",
  REVIEW_REQUIRED: "This refund requires manual review by the platform.",
};
function Facts({ children }) { return <dl className="admin-record-facts">{children}</dl>; }
function Fact({ label, children }) { return <div><dt>{label}</dt><dd>{children ?? "Not recorded"}</dd></div>; }

export default function AdminBookingDetails({ userId, id, onClose }) {
  const { language } = usePreferences();
  const resource = useResource(`admin-booking:${userId}:${id}`, signal => getAdminBooking(id, signal));
  const data = resource.data;
  const booking = data?.booking;
  return <Modal className="admin-booking-modal" title="Booking details" onClose={onClose}>
    <div className="admin-section-heading"><span className="admin-test-label">STRIPE SANDBOX · TEST RECORDS ONLY</span><button className="outline-button" disabled={resource.status === "loading"} onClick={resource.reload}>Refresh details</button></div>
    <RequestState resource={resource} loading="Loading booking details…" />
    {booking && <div className="admin-booking-details">
      <div className="admin-booking-information">
        <section className="admin-record-card"><h3>{booking.hotelName}</h3><p>{booking.roomName}</p><p className="admin-reference">Reference: {booking.reference}</p><div className="admin-record-statuses"><RecordStatus value={booking.status} /><RecordStatus value={booking.paymentStatus} /></div>
          <Facts><Fact label="Check-in">{booking.checkIn}</Fact><Fact label="Check-out">{booking.checkOut}</Fact><Fact label="Rooms / guests">{booking.rooms} / {booking.guests}</Fact><Fact label="Booking created">{recordTime(booking.createdAt, language)}</Fact>{booking.cancelledAt && <Fact label="Booking cancelled">{recordTime(booking.cancelledAt, language)}</Fact>}{booking.expiresAt && <Fact label="Booking expiry">{recordTime(booking.expiresAt, language)}</Fact>}</Facts>
        </section>
        <section className="admin-record-card"><h3>Guest and hotel host</h3><Facts><Fact label="Guest">{data.guest.name}<span>{data.guest.email}</span></Fact><Fact label="Host">{data.host.name}<span>{data.host.email}</span></Fact></Facts></section>
        <section className="admin-record-card"><h3>Nightly breakdown</h3><p className="admin-muted">Saved nightly prices × {booking.rooms} {booking.rooms === 1 ? "room" : "rooms"}.</p><table className="admin-table"><caption className="admin-sr-only">Saved booking nightly prices</caption><thead><tr><th>Night</th><th>Per room</th><th>Night total</th></tr></thead><tbody>{data.nights.map(night => <tr key={night.date}><td>{night.date}</td><td>{originalMoney(night.unitPrice, booking.currencyCode, language)}</td><td>{originalMoney(Number(night.unitPrice) * booking.rooms, booking.currencyCode, language)}</td></tr>)}</tbody><tfoot><tr><th colSpan={2}>Booking total</th><td className="admin-money">{originalMoney(booking.total, booking.currencyCode, language)}</td></tr></tfoot></table></section>
      </div>
      <aside className="admin-booking-financials" aria-label="Payment and refund records">
        <section className="admin-record-card"><h3>Current payment record</h3>{data.payment ? <><RecordStatus value={data.payment.status} /><p className="admin-record-amount">{originalMoney(data.payment.amountMinor, data.payment.currencyCode, language, true)}</p><Facts><Fact label="Record created">{recordTime(data.payment.createdAt, language)}</Fact><Fact label="Payment confirmed">{recordTime(data.payment.paidAt, language)}</Fact><Fact label="Session expires">{recordTime(data.payment.expiresAt, language)}</Fact><Fact label="Cancellation requested">{data.payment.cancellationRequested ? "Yes" : "No"}</Fact><Fact label="Stripe session">{data.payment.sessionId}</Fact><Fact label="Payment intent">{data.payment.paymentIntentId}</Fact></Facts></> : <p>No payment record has been created for this booking.</p>}</section>
        <section className="admin-record-card"><h3>Current refund record</h3>{data.refund ? <><RecordStatus value={data.refund.status} /><p className="admin-record-amount">{originalMoney(data.refund.amountMinor, data.refund.currencyCode, language, true)}</p><p>{refundMessages[data.refund.status] || "Refresh to read the latest saved refund status."}</p><Facts><Fact label="Record created">{recordTime(data.refund.createdAt, language)}</Fact><Fact label="Record updated">{recordTime(data.refund.updatedAt, language)}</Fact><Fact label="Refund ID">{data.refund.refundId}</Fact><Fact label="Payment intent">{data.refund.paymentIntentId}</Fact><Fact label="Policy version">{data.refund.policyVersion}</Fact></Facts></> : <p>No refund has been requested for this booking.</p>}</section>
        <p className="admin-muted">Read-only current records. Amounts retain their original currency. Timestamps use your browser's local time zone.</p>
      </aside>
    </div>}
  </Modal>;
}
