import { useState } from "react";
import { bookingStatuses, paymentStatuses, refundStatuses, statusLabel } from "./adminBookingUtils";

export default function AdminBookingFilters({ filters, refunds = false, onApply, onReset }) {
  const [error, setError] = useState("");
  function apply(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    Object.keys(values).forEach(key => { values[key] = values[key].trim(); });
    if (values.checkInFrom && values.checkInTo && values.checkInFrom > values.checkInTo) {
      setError("Check-in from must be on or before check-in to."); return;
    }
    setError(""); onApply({ ...values, page: 0, size: Number(values.size), ...(filters.hotelId ? { hotelId: filters.hotelId } : {}) });
  }
  return <form className="admin-filters admin-booking-filters" onSubmit={apply} aria-label={refunds ? "Filter refunds" : "Filter bookings"}>
    <label>Reference or guest email<input name="search" defaultValue={filters.search} maxLength={254} placeholder="Booking reference or guest email" /></label>
    <label>Hotel name<input name="hotel" defaultValue={filters.hotel} maxLength={160} placeholder="Search hotel name" /></label>
    <label>{refunds ? "Refund status" : "Booking status"}<select name="status" defaultValue={filters.status}><option value="">All statuses</option>{(refunds ? refundStatuses : bookingStatuses).map(status => <option value={status} key={status}>{statusLabel(status)}</option>)}</select></label>
    {!refunds && <label>Payment status<select name="paymentStatus" defaultValue={filters.paymentStatus}><option value="">All payment statuses</option>{paymentStatuses.map(status => <option value={status} key={status}>{statusLabel(status)}</option>)}</select></label>}
    <label>Check-in from (inclusive)<input type="date" name="checkInFrom" defaultValue={filters.checkInFrom} /></label>
    <label>Check-in to (inclusive)<input type="date" name="checkInTo" defaultValue={filters.checkInTo} /></label>
    <label>Records per page<input type="number" name="size" min={1} max={100} defaultValue={filters.size} required /></label>
    {filters.hotelId && <p className="admin-muted admin-filter-scope">Scoped to hotel #{filters.hotelId}. Reset filters to include all hotels.</p>}
    <div className="admin-filter-actions"><button className="dark-button" type="submit">Apply filters</button><button className="outline-button" type="button" onClick={onReset}>Reset filters</button></div>
    {error && <p className="admin-error admin-filter-scope" role="alert">{error}</p>}
  </form>;
}
