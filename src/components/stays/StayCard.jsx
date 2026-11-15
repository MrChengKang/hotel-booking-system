import { photo } from "../../utils/images";
import { usePreferences } from "../../context/PreferencesContext";

function Heart({ filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill={filled ? "#fb7185" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"
      />
    </svg>
  );
}

export default function StayCard({ stay, isSaved, onToggleSaved, onOpenHotel }) {
  const { formatPrice } = usePreferences();
  const href = `/hotel/${encodeURIComponent(stay.id)}`;
  function openHotel(event) {
    if (onOpenHotel && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      onOpenHotel(stay);
    }
  }
  return (
    <article className="stay-card">
      <div className="stay-image">
        <a href={href} className="stay-photo-link" aria-label={`View ${stay.name}`} onClick={openHotel}><img src={photo(stay.image, 700)} alt={stay.name} loading="lazy" /></a>
        {stay.sale && <span className="stay-sale">−10% today</span>}
        <button
          className={`stay-save ${isSaved ? "is-saved" : ""}`}
          aria-label={`Save ${stay.name}`}
          aria-pressed={isSaved}
          onClick={onToggleSaved}
        >
          <Heart filled={isSaved} />
        </button>
      </div>
      <p className="stay-type">
        {stay.type} · {stay.beds} {stay.beds === 1 ? "bed" : "beds"}
      </p>
      <h3 title={stay.name}><a href={href} onClick={openHotel}>{stay.name}</a></h3>
      <p className="stay-address">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        <span>{stay.address}, {stay.city}</span>
      </p>
      <div className="stay-bottom">
        <p><strong>{formatPrice(stay.price)}</strong><span> / night</span></p>
        <p className="stay-rating">
          <span className="stay-star" aria-label="Rating">★</span>{" "}
          {stay.rating.toFixed(1)} <span>({stay.reviews})</span>
        </p>
      </div>
    </article>
  );
}
