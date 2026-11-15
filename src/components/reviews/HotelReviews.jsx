import { useTranslation } from "../../i18n";
import { useState } from "react";
import useResource from "../../hooks/useResource";
import { getHotelReviews } from "../../services/reviewApi";
import RequestState from "../live/RequestState";
import "./Reviews.css";

export function ReviewCard({ review, children }) {
  const { t, i18n } = useTranslation();
  return <article className="guest-review"><div className="review-author"><span className="review-initial" aria-hidden="true">{review.authorName.slice(0, 1).toUpperCase()}</span><div><strong>{review.authorName}</strong><small>{new Date(review.createdAt).toLocaleDateString(i18n.language)}{t(" · Booked guest")}</small></div><span className="review-stars" aria-label={t("{{rating}} out of 5 stars", { rating: review.rating })}>{"★".repeat(review.rating)}<span aria-hidden="true">{"☆".repeat(5 - review.rating)}</span></span></div><p className="review-text">{review.comment}</p>{review.hostReply && <div className="review-host-reply"><strong>{t("Hotel response")}</strong><p className="review-text">{review.hostReply}</p><small>{new Date(review.repliedAt).toLocaleDateString(i18n.language)}</small></div>}{children}</article>;
}
export function ReviewSummary({ summary }) {
  const { t } = useTranslation(); return <p className="review-summary">{summary.reviewCount ? <><span aria-hidden="true">★</span> <strong>{summary.averageRating} / 5</strong> · {t("count.reviews", { count: summary.reviewCount })}</> : t("No guest reviews yet.")}</p>; }
export function ReviewPager({ data, onPage }) {
  const { t } = useTranslation(); return data.totalPages > 1 && <div className="live-pagination"><button className="outline-button" disabled={!data.page} onClick={() => onPage(data.page - 1)}>{t("Previous reviews")}</button><span>{data.page + 1} / {data.totalPages}</span><button className="outline-button" disabled={data.page + 1 >= data.totalPages} onClick={() => onPage(data.page + 1)}>{t("Next reviews")}</button></div>; }
export default function HotelReviews({ hotelId }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const resource = useResource(`hotel-reviews:${hotelId}:${page}`, signal => getHotelReviews(hotelId, page, signal));
  return <section className="hotel-detail-panel" id="hotel-reviews"><h2>{t("Guest reviews")}</h2><p className="hotel-muted">{t("Reviews from reservations whose local check-out date has arrived.")}</p><RequestState resource={resource} loading={t("Loading guest reviews…")} />{resource.status === "ready" && resource.data && <><ReviewSummary summary={resource.data.summary} />{resource.data.reviews.items.map(review => <ReviewCard key={review.id} review={review} />)}<ReviewPager data={resource.data.reviews} onPage={setPage} /></>}</section>;
}
