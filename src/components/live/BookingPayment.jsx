import { useTranslation, localizeError } from "../../i18n";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import useResource from "../../hooks/useResource";
import { getBookingPayment, startCheckout, redirectToCheckout } from "../../services/paymentApi";
import RequestState from "./RequestState";
import BookingRefund from "./BookingRefund";
import "./Payment.css";

export default function BookingPayment({ booking, returnState, onChanged }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth(), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const lock = useRef(false), mounted = useRef(true), callbacks = useRef({}), last = useRef("");
  const resource = useResource(`payment:${user.id}:${booking.id}`, signal => getBookingPayment(booking.id, signal));
  callbacks.current = { reload: resource.reload, onChanged };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (booking.status !== "PENDING_PAYMENT") return;
    const refresh = () => { if (document.visibilityState !== "hidden" && !lock.current) callbacks.current.reload(); };
    const timer = setInterval(refresh, 5000); window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [booking.status]);
  useEffect(() => {
    const data = resource.data; if (!data) return;
    const state = `${data.bookingStatus}:${data.paymentStatus}`;
    if ((data.bookingStatus !== booking.status || data.paymentStatus !== booking.paymentStatus) && last.current !== state) { last.current = state; callbacks.current.onChanged(); window.dispatchEvent(new Event("stay:notifications-changed")); }
  }, [resource.data, booking.status, booking.paymentStatus]);
  async function pay() {
    if (lock.current) return; lock.current = true; setBusy(true); setError("");
    try { const result = await startCheckout(booking.id); if (mounted.current) redirectToCheckout(result.url); }
    catch (failure) { if (mounted.current) { setError(failure.message); resource.reload(); } }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  const data = resource.data;
  return <section className="booking-payment"><span className="payment-test-badge">{t("STRIPE SANDBOX · TEST PAYMENTS ONLY")}</span><div className="payment-heading"><h3>{t("Payment")}</h3><button className="live-text-button" disabled={busy} onClick={resource.reload}>{t("Refresh payment status")}</button></div>
    {booking.status === "PENDING_PAYMENT" && <><p>{returnState === "return" ? t("Checking the server for payment confirmation. Returning from Checkout does not confirm your booking.") : returnState === "cancelled" ? t("You returned without completing checkout. Resume payment or cancel this room hold.") : t("Your rooms are temporarily held. Complete test payment to confirm your booking.")}</p>{(data?.expiresAt || booking.expiresAt) && <p className="hotel-muted">{t("Current hold deadline: {{date}}. Checkout may extend this once to allow its payment window.", { date: new Date(data?.expiresAt || booking.expiresAt).toLocaleString(i18n.language) })}</p>}</>}
    {booking.paymentStatus === "PAID" && <p role="status">{t("Sandbox payment confirmed by the server. No real money was charged.")}</p>}
    {booking.paymentStatus === "NOT_REQUIRED" && <p>{t("No payment is required for this reservation.")}</p>}
    {booking.paymentStatus === "REVIEW_REQUIRED" && <p role="alert">{t("A sandbox payment needs manual reconciliation. This reservation has not been reopened.")}</p>}
    {booking.status === "EXPIRED" && <p>{t("The unpaid room hold expired and its inventory was released. Search again to make a new reservation.")}</p>}
    {booking.status === "CONFIRMED" && booking.paymentStatus === "UNPAID" && <p>{t("This is an existing unpaid reservation from before online payments. It has not been charged.")}</p>}
    <RequestState resource={resource} loading={t("Checking payment status…")} />
    {data?.cancellationRequested && booking.status === "PENDING_PAYMENT" && <p>{t("Cancellation is being reconciled with Stripe. Rooms remain held until checkout is safely closed.")}</p>}
    {booking.status === "PENDING_PAYMENT" && data && !data.cancellationRequested && <><button className="reservation-reserve" disabled={busy || !data.checkoutAvailable} onClick={pay}>{busy ? t("Opening checkout…") : t("Pay with Stripe · Test mode")}</button>{!data.checkoutAvailable && <p>{t("Test payments are not configured. The backend needs Stripe sandbox keys.")}</p>}<p className="hotel-muted">{t("Only use Stripe test cards. A declined payment can be retried in the same checkout. Closing the tab does not cancel your room hold.")}</p></>}
    {error && <p role="alert" className="live-error">{localizeError(error, t)}</p>}
    {["PAID", "REFUND_PENDING", "REFUND_FAILED", "REFUNDED"].includes(booking.paymentStatus) && <BookingRefund booking={booking} onChanged={onChanged} />}
  </section>;
}
