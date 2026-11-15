import { statusLabel } from "./adminBookingUtils";

export function RecordStatus({ value }) {
  return <span className={`admin-badge admin-record-${(value || "unknown").toLowerCase()}`}>{statusLabel(value)}</span>;
}
export function BookingIdentity({ booking }) {
  return <><strong>{booking.hotelName}</strong><small>{booking.roomName}</small><small className="admin-reference">{booking.reference}</small></>;
}
export function GuestIdentity({ guest }) {
  return <><strong>{guest.name}</strong><small>{guest.email}</small></>;
}
export function BookingStay({ booking }) {
  return <>{booking.checkIn} → {booking.checkOut}<small>{booking.rooms} {booking.rooms === 1 ? "room" : "rooms"} · {booking.guests} {booking.guests === 1 ? "guest" : "guests"}</small></>;
}
export function BookingDetailLink({ href, onOpen, reference }) {
  return <a className="admin-text" href={href} aria-label={`View booking ${reference}`} onClick={event => {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) { event.preventDefault(); onOpen(); }
  }}>View details</a>;
}
