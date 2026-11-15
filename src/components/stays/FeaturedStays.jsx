import { useState } from "react";
import { stays } from "../../data/stays";
import StayCard from "./StayCard";
import Icon from "../common/Icon";
import "./FeaturedStays.css";

const PAGE_SIZE = 16;
const LOAD_MORE_COUNT = 8;
const cities = ["All", ...new Set(stays.map((hotel) => hotel.city))];

export default function FeaturedStays({ savedOnly = false, onSavedOnlyChange = () => {}, savedHotelIds, onToggleHotel, hotels = stays, onOpenHotel }) {
  const [city, setCity] = useState("All");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [localSaved, setSaved] = useState([]);
  const saved = savedHotelIds ?? localSaved;
  const filtered = hotels.filter((stay) => savedOnly ? saved.includes(stay.id) : city === "All" || stay.city === city);

  function toggleSaved(id) {
    if (onToggleHotel) { onToggleHotel(id); return; }
    setSaved((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function selectCity(nextCity) {
    onSavedOnlyChange(false);
    setCity(nextCity);
    setLimit(PAGE_SIZE);
  }

  function showAll() {
    onSavedOnlyChange(false);
    setCity("All");
    setLimit(hotels.length);
  }

  return (
    <section className="featured-stays container" aria-labelledby="featured-stays-title">
      <h2 id="featured-stays-title">{savedOnly ? "Saved hotels" : "Featured hotels"}</h2>
      <p className="section-subtitle">{savedOnly ? "Your favorite hotels, all in one place." : "Selected based on user reviews. Updated weekly."}</p>
      <div className="stays-toolbar">
        <div className="stays-filters" role="group" aria-label="Filter hotels by city">
          {cities.map((item) => (
            <button
              key={item}
              className={!savedOnly && city === item ? "selected" : ""}
              aria-pressed={!savedOnly && city === item}
              onClick={() => selectCity(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <button className="stays-view-all" onClick={showAll}>
          View all <span aria-hidden="true">→</span>
        </button>
      </div>
      {savedOnly && filtered.length === 0 && (
        <div className="wishlist-empty"><Icon name="heart" size={40} /><h3>No saved hotels yet</h3><p>Tap the heart on a hotel to keep it here.</p><button className="outline-button" onClick={showAll}>Explore hotels</button></div>
      )}
      <div className="stays-grid">
        {filtered.slice(0, limit).map((stay) => (
          <StayCard
            key={stay.id}
            stay={stay}
            isSaved={saved.includes(stay.id)}
            onToggleSaved={() => toggleSaved(stay.id)}
            onOpenHotel={onOpenHotel}
          />
        ))}
      </div>
      {filtered.length > limit && (
        <div className="stays-more">
          <button
            className="dark-button"
            onClick={() => setLimit((current) => current + LOAD_MORE_COUNT)}
          >
            Show me more <Icon name="down" size={17} />
          </button>
        </div>
      )}
    </section>
  );
}
