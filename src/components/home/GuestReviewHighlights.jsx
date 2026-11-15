import { useTranslation } from "../../i18n";
import useResource from "../../hooks/useResource";
import { getReviewHighlights } from "../../services/reviewApi";
import RouteLink from "../common/RouteLink";
import RequestState from "../live/RequestState";
import "./HomeSections.css";
import "./GuestReviewHighlights.css";

export default function GuestReviewHighlights({ onNavigate }) {
  const { t, i18n } = useTranslation();
  const resource = useResource("guest-review-highlights", getReviewHighlights);
  const reviews = resource.data || [];
  // Optional content never falls back to fabricated quotes, people or ratings.
  // Older backends treat the new static route as a numeric hotel ID (400), or return 404.
  if (resource.status === "loading" || resource.status === "idle" || (resource.status === "error" && [400, 404].includes(resource.error.status)) || (resource.status === "ready" && !reviews.length)) return null;
  return <section className="review-highlights container" id="guest-reviews" aria-labelledby="review-highlights-title">
    <div className="collections-heading"><span className="collections-eyebrow">{t("From our guests")}</span><h2 id="review-highlights-title">{t("Recent guest reviews")}</h2><p>{t("The latest reviews from booked stays at hotels currently on STAY.")}</p></div>
    <RequestState resource={resource} loading={t("Loading guest reviews…")} />
    {resource.status === "ready" && <div className="review-highlights-grid" style={{ "--review-columns": Math.min(reviews.length, 3) }}>{reviews.map(review => <figure className="review-highlight" key={review.id}>
      <div className="highlight-rating"><span aria-label={t("{{rating}} out of 5 stars", { rating: review.rating })}>{"★".repeat(review.rating)}<span aria-hidden="true">{"☆".repeat(5 - review.rating)}</span></span><span>{t("Booked guest")}</span></div>
      <blockquote tabIndex={0}>{review.comment}</blockquote><figcaption><span className="highlight-initial" aria-hidden="true">{review.authorName.slice(0, 1).toUpperCase()}</span><div><strong>{review.authorName}</strong><time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString(i18n.language)}</time></div></figcaption>
      <RouteLink className="highlight-hotel" href={`/hotel/${review.hotelId}`} onNavigate={onNavigate}><span><strong>{review.hotelName}</strong><small>{review.city}</small></span><span aria-hidden="true">↗</span></RouteLink>
    </figure>)}</div>}
  </section>;
}
