import { useTranslation, localizeError } from "../../i18n";
import { useRef, useState } from "react";
import useResource from "../../hooks/useResource";
import { getPaymentConfig } from "../../services/paymentApi";
import { createBooking, getAvailability } from "../../services/hotelApi";
import { useAuth } from "../../context/AuthContext";
import { usePreferences } from "../../context/PreferencesContext";
import { finishRequest, hotelToday, money, requestKey, stayParams } from "../../utils/liveBooking";
import { nightsBetween } from "../../utils/dates";
import DateRangePicker from "../home/DateRangePicker";
import Modal from "../common/Modal";
import RequestState from "./RequestState";

export default function LiveReservation({ hotel, roomTypes, draft, onChange, onLogin, onBooked }) {
  const { t } = useTranslation();
  const auth = useAuth();
  const { language, formatDate } = usePreferences();
  const [calendar, setCalendar] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const dateButton = useRef(null);
  const today = hotelToday(hotel.timeZone);
  const nights = draft.checkIn && draft.checkOut ? nightsBetween(draft.checkIn, draft.checkOut) : 0;
  const values = { checkIn: draft.checkIn, checkOut: draft.checkOut, rooms: Number(draft.rooms), guests: Number(draft.guests) };
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(draft.checkIn) && /^\d{4}-\d{2}-\d{2}$/.test(draft.checkOut) && draft.checkIn >= today && nights > 0 && nights <= 366 && Number.isInteger(values.rooms) && values.rooms >= 1 && values.rooms <= 20 && Number.isInteger(values.guests) && values.guests >= 1 && values.guests <= 1000;
  const payments = useResource("payment-config", getPaymentConfig);
  const paymentReady = payments.status === "ready" && payments.data?.enabled;
  const quoteKey = valid ? JSON.stringify([hotel.id, values]) : null;
  const resource = useResource(quoteKey, signal => getAvailability(hotel.id, values, signal));
  const roomId = draft.roomTypeId || String(resource.data?.[0]?.roomTypeId || roomTypes[0]?.id || "");
  const quote = resource.status === "ready" ? resource.data.find(item => String(item.roomTypeId) === roomId) : null;
  const room = roomTypes.find(item => String(item.id) === roomId);
  const price = amount => money(amount, hotel.currencyCode, language);
  const edit = (name, value) => { setError(""); onChange(current => ({ ...current, [name]: value })); };
  const login = () => onLogin(`/hotel/${hotel.id}?${stayParams({ ...values, roomTypeId: roomId })}`);

  function reserve() {
    if (!quote || pending.current) return;
    if (!auth.user) { login(); return; }
    if (auth.user.role !== "user") return;
    setError("");
    setConfirmation({ quote, values: { ...values, roomTypeId: Number(roomId) }, userId: auth.user.id, roomName: room?.name });
  }
  async function confirm() {
    if (pending.current || !confirmation) return;
    if (!auth.user || auth.user.id !== confirmation.userId) { setConfirmation(null); login(); return; }
    pending.current = true; setBusy(true); setError("");
    try {
      const payload = { ...confirmation.values, expectedTotal: confirmation.quote.total, requestKey: requestKey(auth.user.id, confirmation.values) };
      const result = await createBooking(payload);
      finishRequest(auth.user.id, confirmation.values);
      setConfirmation(null);
      onBooked(result);
    } catch (failure) {
      setError(failure.message);
      if (failure.status === 401) { setConfirmation(null); login(); }
      else if (failure.status === 409) { setConfirmation(null); resource.reload(); }
    } finally { pending.current = false; setBusy(false); }
  }
  return <aside className="reservation-card hotel-detail-panel live-reservation" id="hotel-reservation" aria-label={t("Reserve this hotel")}>
    <h2>{t("Reserve your stay")}</h2><p className="hotel-muted">{t("Live rates ·")}{" "}{hotel.currencyCode}</p>
    <div className="live-calendar-control" onKeyDown={event => { if (event.key === "Escape") { setCalendar(false); dateButton.current?.focus(); } }}><button ref={dateButton} className="reservation-field" aria-label={t("Change reservation dates")} aria-expanded={calendar} onClick={() => setCalendar(v => !v)}><span><strong>{draft.checkIn ? `${formatDate(draft.checkIn)} – ${draft.checkOut ? formatDate(draft.checkOut) : t("Check out")}` : t("Choose dates")}</strong><small>{t("Check in – Check out")}</small></span></button>{calendar && <DateRangePicker checkIn={draft.checkIn} checkOut={draft.checkOut} minDate={today} onChange={(start, end) => onChange(d => ({ ...d, checkIn: start, checkOut: end }))} onComplete={() => { setCalendar(false); dateButton.current?.focus(); }} />}</div>
    <div className="live-guest-fields"><label>{t("Rooms")}<input type="number" min="1" max="20" value={draft.rooms} onChange={event => edit("rooms", event.target.value)} /></label><label>{t("Guests")}<input type="number" min="1" max="1000" value={draft.guests} onChange={event => edit("guests", event.target.value)} /></label></div>
    <label className="live-room-select">{t("Room type")}<select value={roomId} onChange={event => edit("roomTypeId", event.target.value)}>{!roomTypes.length && <option value="">{t("No rooms")}</option>}{roomTypes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    {!valid && <p role="alert" className="live-error">{t("Choose 1–366 nights, 1–20 rooms and 1–1000 guests. Check-in must be today or later at the hotel.")}</p>}
    <RequestState resource={resource} loading={t("Checking live availability…")} />
    {resource.status === "ready" && !quote && <p className="live-state">{t("No rooms of this type are available for the entire stay. Try other dates, fewer guests or another room type.")}</p>}
    {quote && <dl className="reservation-totals">{quote.nights.map(night => <div key={night.date}><dt>{formatDate(night.date)} · {t("count.rooms", { count: values.rooms })}</dt><dd>{price(Number(night.unitPrice) * values.rooms)}</dd></div>)}<div className="reservation-total"><dt>{t("Total · {{nights}}", { nights: t("count.nights", { count: nights }) })}</dt><dd aria-label={t("Reservation total")}>{price(quote.total)}</dd></div></dl>}
    {error && !confirmation && <p className="live-error" role="alert">{localizeError(error, t)}</p>}
    <button className="reservation-reserve" disabled={!quote || (!paymentReady && Number(quote?.total) !== 0) || auth.loading || busy || (auth.user && auth.user.role !== "user")} onClick={reserve}>{!auth.user && !auth.loading ? t("Sign in to reserve") : t("Reserve")}</button>
    {auth.user && auth.user.role !== "user" && <p className="hotel-muted">{t("Reservations are available for User accounts. You are signed in as {{role}}.", { role: t(auth.user.role === "host" ? t("Hotel Host") : t("Admin")) })}</p>}
    <RequestState resource={payments} loading={t("Checking test payment availability…")} />{payments.status === "ready" && !paymentReady && <p className="payment-setup-note">{t("Stripe sandbox payments are not configured yet. Booking becomes available once the backend test keys are set.")}</p>}<p className="hotel-muted">{t("Stripe sandbox only. New unpaid bookings hold rooms temporarily; payment confirms the reservation.")}</p>
    <p className="hotel-muted">{t("Full refund before midnight on the hotel's local check-in date. After that, online cancellation is unavailable.")}</p>
    {confirmation && <Modal title={t("Confirm your reservation")} onClose={() => { if (!pending.current) setConfirmation(null); }}><div className="reservation-preview"><h3>{hotel.name}</h3><p>{confirmation.roomName}</p><p>{confirmation.values.checkIn} – {confirmation.values.checkOut} · {t("count.rooms", { count: confirmation.values.rooms })} · {t("count.guests", { count: confirmation.values.guests })}</p><p className="reservation-preview-total">{t("Total: {{price}}", { price: price(confirmation.quote.total) })}</p><p>{t("Confirming creates a temporary room hold. Continue to My Bookings to pay with Stripe test cards. Paid bookings follow the full-refund cancellation policy shown before booking.")}</p>{error && <p role="alert" className="live-error">{localizeError(error, t)}</p>}<button className="reservation-reserve" disabled={busy} onClick={confirm}>{busy ? t("Creating reservation…") : t("Confirm reservation")}</button><button className="outline-button" disabled={busy} onClick={() => setConfirmation(null)}>{t("Go back")}</button></div></Modal>}
  </aside>;
}
