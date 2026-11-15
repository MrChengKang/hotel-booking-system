import { useEffect, useRef, useState } from "react";
import DateRangePicker from "../home/DateRangePicker";
import GuestPicker from "../home/GuestPicker";
import Icon from "../common/Icon";
import Modal from "../common/Modal";
import { usePreferences } from "../../context/PreferencesContext";
import { countGuests, updateGuestCount } from "../../utils/guests";
import { nightsBetween, todayKey } from "../../utils/dates";
import { calculateReservation } from "../../utils/reservation";

export default function ReservationCard({ hotel, dates, onDatesChange, guests, onGuestsChange }) {
  const { formatPrice, formatDate } = usePreferences();
  const [panel, setPanel] = useState(null);
  const [preview, setPreview] = useState(false);
  const control = useRef(null);
  const dateButton = useRef(null);
  const guestButton = useRef(null);
  const nights = dates.start && dates.end ? nightsBetween(dates.start, dates.end) : 0;
  const quote = calculateReservation(hotel.price, nights);
  const valid = Boolean(quote && dates.start >= todayKey());
  const totalGuests = countGuests(guests);

  useEffect(() => {
    if (!panel) return;
    const dismiss = (event) => { if (!control.current.contains(event.target)) setPanel(null); };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [panel]);

  function closePanel() {
    setPanel(null);
    (panel === "guests" ? guestButton : dateButton).current?.focus();
  }

  return (
    <aside
      className="reservation-card hotel-detail-panel"
      id="hotel-reservation"
      aria-label="Reserve this hotel"
    >
      <div className="reservation-price">{hotel.sale && <del>{formatPrice(Math.round(hotel.price / .9))}</del>}<strong>{formatPrice(hotel.price)}</strong><span>/night</span></div>
      <div
        ref={control}
        className="reservation-controls"
        onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); closePanel(); } }}
      >
        <div className="reservation-date-field">
          <button
            ref={dateButton}
            className="reservation-field"
            aria-label="Change reservation dates"
            aria-expanded={panel === "dates"}
            onClick={() => setPanel(panel === "dates" ? null : "dates")}
          ><Icon name="calendar" /><span><strong>{dates.start ? `${formatDate(dates.start)} - ${dates.end ? formatDate(dates.end) : "Check out"}` : "Add dates"}</strong><small>Check in - Check out</small></span></button>
          {panel === "dates" && <DateRangePicker
            checkIn={dates.start}
            checkOut={dates.end}
            onChange={onDatesChange}
            onComplete={closePanel}
          />}
        </div>
        <div className="reservation-guests">
          <button
            ref={guestButton}
            className="reservation-field"
            aria-label="Change reservation guests"
            aria-expanded={panel === "guests"}
            onClick={() => setPanel(panel === "guests" ? null : "guests")}
          ><Icon name="guests" /><span><strong>{totalGuests} {totalGuests === 1 ? "guest" : "guests"}</strong><small>Guests · up to {hotel.capacity}</small></span></button>
          {panel === "guests" && <GuestPicker
            guests={guests}
            maxGuests={hotel.capacity}
            onChange={(type, amount) => { const next = updateGuestCount(guests, type, amount); if (countGuests(next) <= hotel.capacity) onGuestsChange(next); }}
          />}
        </div>
      </div>
      {quote && valid ? <dl className="reservation-totals">
        <div><dt>{formatPrice(hotel.price, 2)} × {nights} {nights === 1 ? "night" : "nights"}</dt><dd>{formatPrice(quote.room, 2)}</dd></div>
        <div><dt>Cleaning fee</dt><dd>{formatPrice(quote.cleaning, 2)}</dd></div>
        <div><dt>Service fee</dt><dd>{formatPrice(quote.service, 2)}</dd></div>
        <div><dt>Taxes</dt><dd>{formatPrice(quote.taxes, 2)}</dd></div>
        <div className="reservation-total"><dt>Total</dt><dd aria-label="Reservation total">{formatPrice(quote.total, 2)}</dd></div>
      </dl> : <p className="hotel-muted">Choose check-in and check-out dates to calculate your total.</p>}
      <button
        className="reservation-reserve"
        disabled={!valid}
        onClick={() => { setPanel(null); setPreview(true); }}
      >Reserve</button>
      <p className="reservation-demo-note">Preview only · no booking or payment will be made</p>
      {preview && quote && <Modal title="Reservation preview" onClose={() => setPreview(false)}><div className="reservation-preview"><h3>{hotel.name}</h3><p>{formatDate(dates.start)} – {formatDate(dates.end)} · {nights} nights · {totalGuests} guests</p><p className="reservation-preview-total">Total: {formatPrice(quote.total, 2)}</p><p>This hotel is not booked. No payment has been taken. This is an example quote.</p><button className="dark-button" onClick={() => setPreview(false)}>Continue exploring</button></div></Modal>}
    </aside>
  );
}
