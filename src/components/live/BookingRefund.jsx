import { useEffect, useRef, useState } from "react";
import { useTranslation, localizeError } from "../../i18n";
import { usePreferences } from "../../context/PreferencesContext";
import { useAuth } from "../../context/AuthContext";
import useResource from "../../hooks/useResource";
import { getCancellation, requestRefund } from "../../services/paymentApi";
import { money } from "../../utils/liveBooking";
import RequestState from "./RequestState";

export default function BookingRefund({ booking, onChanged }) {
  const { t } = useTranslation();
  const { language } = usePreferences();
  const { user } = useAuth();
  const resource = useResource(`refund:${user.id}:${booking.id}:${booking.paymentStatus}`, signal => getCancellation(booking.id, signal));
  const [confirming, setConfirming] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const lock = useRef(false), mounted = useRef(true), callbacks = useRef({}), last = useRef("");
  callbacks.current = { reload: resource.reload, onChanged };
  const data = resource.data;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!["INITIALIZING", "PENDING"].includes(data?.status)) return;
    const refresh = () => { if (document.visibilityState !== "hidden" && !lock.current) callbacks.current.reload(); };
    const timer = setInterval(refresh, 5000); window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [data?.status]);
  useEffect(() => {
    const expected = { INITIALIZING: "REFUND_PENDING", PENDING: "REFUND_PENDING", SUCCEEDED: "REFUNDED", FAILED: "REFUND_FAILED" }[data?.status];
    if (expected && expected !== booking.paymentStatus && last.current !== data.status) {
      last.current = data.status; callbacks.current.onChanged();
      window.dispatchEvent(new Event("stay:notifications-changed"));
    }
  }, [data, booking.paymentStatus]);
  async function submit() {
    if (lock.current || !data?.allowed) return;
    lock.current = true; setBusy(true); setError("");
    try {
      await requestRefund(booking.id, data.refundAmount);
      if (mounted.current) { setConfirming(false); callbacks.current.onChanged(); }
      window.dispatchEvent(new Event("stay:notifications-changed"));
    } catch (failure) {
      if (mounted.current) { setError(failure.message); setConfirming(false); callbacks.current.onChanged(); }
    } finally {
      lock.current = false;
      if (mounted.current) { setBusy(false); callbacks.current.reload(); }
    }
  }
  return <section className="booking-refund" aria-label={t("Cancellation and refund")}>
    <div className="refund-heading"><h3>{t("Cancellation and refund")}</h3><button className="live-text-button" disabled={busy} onClick={resource.reload}>{t("Refresh refund status")}</button></div>
    <RequestState resource={resource} loading={t("Checking cancellation policy…")} />
    {data && <>
      <p>{t("Full refund before midnight on the hotel's local check-in date. After that, online cancellation is unavailable.")}</p>
      {data.status === "NOT_REQUESTED" && <p className="hotel-muted">{t("Cancellation deadline: {{date}} ({{zone}})", {
        date: new Date(data.deadline).toLocaleString(language, { timeZone: data.hotelTimeZone }), zone: data.hotelTimeZone,
      })}</p>}
      <p className="refund-amount">{t("Refund amount: {{amount}}", { amount: money(data.refundAmount, data.currencyCode, language) })}</p>
      {data.status !== "NOT_REQUESTED" && <p className="refund-status" role={data.status === "FAILED" || data.status === "REVIEW_REQUIRED" ? "alert" : "status"}>
        {t({ INITIALIZING: "Refund request received. We are verifying it with Stripe; your rooms are still reserved.", PENDING: "Refund pending. Your rooms stay reserved until Stripe confirms the refund.", SUCCEEDED: "Your booking is cancelled and the full test payment was refunded. Your rooms have been released.", FAILED: "The refund failed. Your booking and rooms are retained. Contact support.", REVIEW_REQUIRED: "The refund needs manual review. Your booking and rooms are retained." }[data.status] || "Refund status unavailable. Please refresh.")}
      </p>}
      {!data.allowed && data.status === "NOT_REQUESTED" && <p>{localizeError(data.reason, t)}</p>}
      {data.allowed && !confirming && <button className="outline-button" disabled={busy} onClick={() => setConfirming(true)}>{t("Cancel booking and request refund")}</button>}
      {confirming && data.allowed && <div className="refund-confirmation" role="group" aria-label={t("Confirm cancellation and refund")}>
        <h4>{t("Cancel this paid booking?")}</h4>
        <p>{t("This requests a full refund to the original payment method. Cancellation and room release happen only after refund success. Sandbox only; no real money moves.")}</p>
        <button className="reservation-reserve" disabled={busy} onClick={submit}>{busy ? t("Requesting refund…") : t("Confirm cancellation and refund")}</button>
        <button className="outline-button" disabled={busy} onClick={() => setConfirming(false)}>{t("Keep booking")}</button>
      </div>}
    </>}
    {error && <p className="live-error" role="alert">{localizeError(error, t)}</p>}
  </section>;
}
