import { useTranslation, localizeError } from "../../i18n";
import { usePreferences } from "../../context/PreferencesContext";
import { money } from "../../utils/liveBooking";
import { bookingStatus, canCancelBooking } from "../../utils/payment";
import Icon from "../common/Icon";
import BookingReview from "../reviews/BookingReview";
import BookingPayment from "./BookingPayment";
import "./BookingDetails.css";

export default function BookingDetails({ detail, cancelling, busy, error, returnState, onChanged, onCancel, onConfirmCancel, onKeepBooking }) {
  const { t } = useTranslation();
  const { language } = usePreferences();
  const { booking, nights } = detail;
  return <div className={`booking-details-layout${cancelling ? " is-cancelling" : ""}`}>
    <section className="booking-details-summary">
      <span className={`live-status${booking.status === "CANCELLED" ? " is-cancelled" : ""}`}>{t(bookingStatus(booking))}</span>
      <h3>{booking.hotelName}</h3>
      <p className="booking-details-room">{booking.roomName}</p>
      <div className="booking-details-stay">
        <p><Icon name="calendar" size={18} /><span>{booking.checkIn} – {booking.checkOut}</span></p>
        <p><Icon name="guests" size={18} /><span>{t("count.rooms", { count: booking.rooms })} · {t("count.guests", { count: booking.guests })}</span></p>
      </div>
      <p className="booking-details-reference"><span>{t("Reference:")}</span> <span>{booking.reference}</span></p>
      <div className="booking-details-costs">
        <dl className="reservation-totals booking-details-nights" tabIndex={nights.length > 4 ? 0 : undefined} aria-label={t("Booking information")}>
          {nights.map(night => <div key={night.date}><dt>{night.date} × {t("count.rooms", { count: booking.rooms })}</dt><dd>{money(Number(night.unitPrice) * booking.rooms, booking.currencyCode, language)}</dd></div>)}
        </dl>
        <dl className="reservation-totals booking-details-total"><div className="reservation-total"><dt>{t("Total")}</dt><dd>{money(booking.total, booking.currencyCode, language)}</dd></div></dl>
      </div>
      {canCancelBooking(booking) && <div className="booking-details-cancel">{cancelling ? <>
        <p>{t("Cancelling closes any open checkout before releasing rooms. This unpaid reservation can be cancelled before the hotel's local check-in date.")}</p>
        <button className="reservation-reserve" disabled={busy} onClick={onConfirmCancel}>{busy ? t("Cancelling…") : t("Confirm cancellation")}</button>
        <button className="outline-button" disabled={busy} onClick={onKeepBooking}>{t("Keep booking")}</button>
      </> : <button className="outline-button" onClick={onCancel}>{t("Cancel booking")}</button>}</div>}
      {error && <p className="live-error" role="alert">{localizeError(error, t)}</p>}
    </section>
    {!cancelling && <>
      <div className="booking-details-actions"><BookingPayment booking={booking} returnState={returnState} onChanged={onChanged} /></div>
      <div className="booking-details-review"><BookingReview bookingId={booking.id} /></div>
    </>}
  </div>;
}
