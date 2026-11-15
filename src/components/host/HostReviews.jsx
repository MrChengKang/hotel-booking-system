import { useState } from "react";
import useResource from "../../hooks/useResource";
import { getHostReviews, replyToReview } from "../../services/reviewApi";
import RequestState from "../live/RequestState";
import { ReviewCard, ReviewSummary, ReviewPager } from "../reviews/HotelReviews";
import HostForm, { Field } from "./HostForm";

export default function HostReviews({ hotel, onNotify }) {
  const [page, setPage] = useState(0), [editing, setEditing] = useState(null);
  const resource = useResource(`host-reviews:${hotel.id}:${page}`, signal => getHostReviews(hotel.id, page, signal));
  return <section className="host-panel"><div className="host-section-head"><div><h2>Guest reviews</h2><p>{hotel.name} · Respond to your guests.</p></div><button className="outline-button" onClick={resource.reload}>Refresh reviews</button></div><RequestState resource={resource} loading="Loading hotel reviews…" />{resource.status === "ready" && <><ReviewSummary summary={resource.data.summary} />{resource.data.reviews.items.map(review => <ReviewCard key={review.id} review={review}><button className="outline-button" disabled={hotel.status === "ARCHIVED"} onClick={() => setEditing(review)}>{review.hostReply ? "Edit hotel response" : "Reply to guest"}</button></ReviewCard>)}<ReviewPager data={resource.data.reviews} onPage={setPage} /></>}{editing && <HostForm title="Hotel response" submitLabel="Publish response" onClose={() => setEditing(null)} onSubmit={values => replyToReview(hotel.id, editing.id, values.reply)} onSuccess={() => { setEditing(null); resource.reload(); onNotify("Hotel response saved."); }}><Field label="Your response"><textarea name="reply" defaultValue={editing.hostReply || ""} required maxLength={1000} rows={5} /></Field><p>Your response will be public. The guest is notified when you first reply.</p></HostForm>}</section>;
}
