import { useTranslation } from "../../i18n";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { usePreferences } from "../../context/PreferencesContext";
import { cancelBooking, getBooking, getBookings } from "../../services/hotelApi";
import useResource from "../../hooks/useResource";
import { money } from "../../utils/liveBooking";
import BookingDetails from "./BookingDetails";
import { bookingStatus } from "../../utils/payment";
import Modal from "../common/Modal";
import RequestState from "./RequestState";
import "../hotels/HotelDetailPage.css";
import "./LiveBooking.css";

export default function MyBookings({ onLogin, onBrowse, params, onNotify = () => {} }) {
  const { t } = useTranslation();
  const auth = useAuth();
  const [page, setPage] = useState(0);
  const allowed = auth.user?.role === "user";
  const paymentReturn = ["return", "cancelled"].includes(params.get("payment")) && /^[1-9]\d*$/.test(params.get("booking") || "") ? `/bookings?booking=${params.get("booking")}&payment=${params.get("payment")}` : "/";
  const [selected, setSelected] = useState(params.get("booking") || null);
  const [cancelling, setCancelling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const pending = useRef(false);
  const { language } = usePreferences();
  const list = useResource(allowed ? JSON.stringify([auth.user.id, page]) : null, signal => getBookings(page, signal));
  const detail = useResource(allowed && selected ? `${auth.user.id}:${selected}` : null, signal => getBooking(selected, signal));
  useEffect(() => { if (!auth.loading && !auth.user) onLogin(paymentReturn); }, [auth.loading, auth.user, onLogin, paymentReturn]);
  function close() { if (!pending.current) { setSelected(null); setCancelling(false); setError(""); } }
  async function confirmCancel() {
    if (pending.current || !selected) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const result = await cancelBooking(selected);
      setNotice(t("Booking {{reference}}: {{status}}. Its reserved rooms have been released.", { reference: result.booking.reference, status: t(bookingStatus(result.booking)) }));
      onNotify(t("Reservation {{reference}} cancelled.", { reference: result.booking.reference }));
      setSelected(null); setCancelling(false); list.reload();
    } catch (failure) { setError(failure.message); }
    finally { pending.current = false; setBusy(false); }
  }
  if (auth.loading) return <section className="container live-bookings"><p role="status">{t("Checking your account…")}</p></section>;
  if (!auth.user) return <section className="container live-bookings"><h1>{t("My Bookings")}</h1><button className="dark-button" onClick={() => onLogin(paymentReturn)}>{t("Sign in")}</button></section>;
  if (!allowed) return <section className="container live-bookings"><h1>{t("My Bookings")}</h1><p>{t("Booking history is available for User accounts. You are signed in as {{role}}.", { role: t(auth.user.role === "host" ? t("Hotel Host") : t("Admin")) })}</p><button className="outline-button" onClick={onBrowse}>{t("Browse hotels")}</button></section>;
  return <section className="container live-bookings"><div className="live-section-heading"><div><h1>{t("My Bookings")}</h1><p>{t("Manage your stays and sandbox payments")}</p></div><button className="outline-button" onClick={onBrowse}>{t("Find a hotel")}</button></div>
    {notice && <p className="live-notice" role="status">{notice}</p>}
    <RequestState resource={list} loading={t("Loading your bookings…")} onLogin={() => onLogin(paymentReturn)} />
    {list.status === "ready" && list.data.items.length === 0 && <div className="live-state"><h2>{t("No bookings yet")}</h2><p>{t("Choose a hotel, check its rooms and confirm a reservation to get started.")}</p><button className="dark-button" onClick={onBrowse}>{t("Explore hotels")}</button></div>}
    <div className="live-booking-list">{list.status === "ready" && list.data.items.map(booking => <article className="hotel-detail-panel live-booking-item" key={booking.id}><div><span className={`live-status ${booking.status === "CANCELLED" ? "is-cancelled" : ""}`}>{t(bookingStatus(booking))}</span><h2>{booking.hotelName}</h2><p>{booking.roomName}</p><p>{booking.checkIn} – {booking.checkOut} · {t("count.rooms", { count: booking.rooms })} · {t("count.guests", { count: booking.guests })}</p><p className="hotel-muted">{t("Reference:")}{" "}{booking.reference}</p></div><div><strong>{money(booking.total, booking.currencyCode, language)}</strong><button className="outline-button" onClick={() => { setSelected(booking.id); setCancelling(false); setError(""); }}>{t("View booking {{reference}}", { reference: booking.reference })}</button></div></article>)}</div>
    {list.data && list.data.totalPages > 1 && <div className="live-pagination"><button className="outline-button" disabled={page === 0} onClick={() => setPage(v => v - 1)}>{t("Previous bookings")}</button><span>{t("Page {{page}} / {{total}}", { page: page + 1, total: list.data.totalPages })}</span><button className="outline-button" disabled={page + 1 >= list.data.totalPages} onClick={() => setPage(v => v + 1)}>{t("Next bookings")}</button></div>}
    {selected && <Modal className="booking-details-modal" title={cancelling ? t("Cancel this booking?") : t("Booking details")} onClose={close}>
      <div className="booking-dialog-body">
        <RequestState resource={detail} loading={t("Loading booking details…")} />
        {detail.status === "ready" && <BookingDetails
          detail={detail.data}
          cancelling={cancelling}
          busy={busy}
          error={error}
          returnState={params.get("payment")}
          onChanged={() => { detail.reload(); list.reload(); }}
          onCancel={() => { setCancelling(true); setError(""); }}
          onConfirmCancel={confirmCancel}
          onKeepBooking={() => setCancelling(false)}
        />}
      </div>
    </Modal>}
  </section>;
}
