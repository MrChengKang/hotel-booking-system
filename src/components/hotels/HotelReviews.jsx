import { useState } from "react";
import Icon from "../common/Icon";
import { sampleHotelReviews } from "../../data/hotelDetails";
import { photo } from "../../utils/images";
import { todayKey, parseDate } from "../../utils/dates";
import { usePreferences } from "../../context/PreferencesContext";

export default function HotelReviews({ hotel }) {
  const [reviews, setReviews] = useState(sampleHotelReviews);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const { language } = usePreferences();
  function submit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    setReviews((current) => [{ id: Date.now(), name: "Demo guest", rating, date: todayKey(), image: "photo-1500648767791-00dcc994a43e", text: text.trim() }, ...current]);
    setText("");
    setMessage("Review added to this preview only.");
  }
  return (
    <section className="hotel-reviews" aria-labelledby="hotel-reviews-title">
      <aside className="hotel-team hotel-detail-panel"><div className="hotel-team-heading"><img src={photo("photo-1534528741775-53994a69daeb", 140)} alt="Example hotel team member" /><div><h3>Hotel guest services</h3><p>{hotel.city}</p></div></div><p className="hotel-star">★ {hotel.rating.toFixed(1)} · Guest-rated hotel</p><p>Our example hotel team is here to help with room questions, arrival details and your stay.</p><ul><li><Icon name="calendar" size={20} /> Check-in information</li><li><Icon name="help" size={20} /> Room and amenity questions</li><li><Icon name="user" size={20} /> Guest assistance</li></ul><button
        className="outline-button"
        onClick={() => document.getElementById("hotel-about").scrollIntoView({ behavior: "smooth" })}
      >Hotel information</button></aside>
      <div className="hotel-review-list"><h2 id="hotel-reviews-title">Reviews ({hotel.reviews} reviews)</h2><p className="hotel-review-stars" aria-label="Hotel guest rating">★★★★★</p><form className="hotel-review-form" onSubmit={submit}><label>Rating<select
        aria-label="Your rating"
        value={rating}
        onChange={(event) => setRating(Number(event.target.value))}
      >{[5, 4, 3, 2, 1].map((value) => <option value={value} key={value}>{value} stars</option>)}</select></label><div><input
        aria-label="Your review"
        required
        maxLength={1200}
        placeholder="Share your thoughts ..."
        value={text}
        onChange={(event) => setText(event.target.value)}
      /><button aria-label="Submit review">→</button></div></form><p className="hotel-muted">Example reviews. New reviews stay in this page session only.</p>{message && <p role="status">{message}</p>}
        {reviews.map((review) => <article className="hotel-review" key={review.id}><img src={photo(review.image, 100)} alt="" /><div><span className="hotel-star" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span><h3>{review.name}</h3><time dateTime={review.date}>{parseDate(review.date).toLocaleDateString(language, { month: "short", day: "numeric", year: "numeric" })}</time><p>{review.text}</p></div></article>)}
      </div>
    </section>
  );
}
