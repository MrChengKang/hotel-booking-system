import { useTranslation, localizeError } from "../../i18n";
import { useRef, useState } from "react";
import useResource from "../../hooks/useResource";
import { getBookingReview, saveBookingReview } from "../../services/reviewApi";
import { useAuth } from "../../context/AuthContext";
import RequestState from "../live/RequestState";
import { ReviewCard } from "./HotelReviews";

export default function BookingReview({ bookingId }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const resource = useResource(`booking-review:${user.id}:${bookingId}`, signal => getBookingReview(bookingId, signal));
  return <section className="booking-review"><h3>{t("Your hotel review")}</h3><RequestState resource={resource} loading={t("Checking review eligibility…")} />{resource.status === "ready" && resource.data && <>{!resource.data.eligible ? <p className="hotel-muted">{localizeError(resource.data.reason, t)}</p> : <ReviewForm key={resource.data.review?.updatedAt || "new"} bookingId={bookingId} existing={resource.data.review} onSaved={resource.reload} />}</>}</section>;
}
function ReviewForm({ bookingId, existing, onSaved }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(existing?.rating || 5), [comment, setComment] = useState(existing?.comment || ""), [editing, setEditing] = useState(!existing);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""); const lock = useRef(false);
  if (!editing) return <><ReviewCard review={existing} /><button className="outline-button" onClick={() => setEditing(true)}>{t("Edit your review")}</button></>;
  return <form className="review-form" aria-label={t("Hotel review")} onSubmit={async event => { event.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setError(""); try { await saveBookingReview(bookingId, { rating: Number(rating), comment }); onSaved(); } catch (failure) { setError(failure.message); } finally { lock.current = false; setBusy(false); } }}><fieldset disabled={busy}><label>{t("Rating")}<select value={rating} onChange={event => setRating(event.target.value)}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{t("count.stars", { count: n })}</option>)}</select></label><label>{t("Your experience")}<textarea value={comment} onChange={event => setComment(event.target.value)} required minLength={1} maxLength={2000} rows={5} placeholder={t("Tell other guests about your stay")} /></label><small>{t("{{count}} / 2000 · Your name and review will be public.", { count: comment.length })}</small>{error && <p role="alert" className="live-error">{localizeError(error, t)}</p>}<div className="review-actions"><button type="submit" className="dark-button">{busy ? t("Saving…") : existing ? t("Save review changes") : t("Publish review")}</button>{existing && <button type="button" className="outline-button" onClick={() => setEditing(false)}>{t("Cancel edit")}</button>}</div></fieldset></form>;
}
