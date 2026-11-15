import { useEffect, useState } from "react";
import Icon from "../common/Icon";
import StayCard from "../stays/StayCard";
import HotelFilters, { DEFAULT_FILTERS } from "./HotelFilters";
import { getCityHotels } from "../../data/cityHotels";
import { photo } from "../../utils/images";
import "./DestinationPage.css";

export default function DestinationPage({ destination, children, saved, onToggleSaved, onHome, onOpenHotel }) {
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [showMap, setShowMap] = useState(false);
  const hotels = getCityHotels(destination);
  const results = hotels.filter((hotel) => (filters.roomType === "All rooms" || hotel.roomType === filters.roomType) && hotel.price <= filters.maxPrice && hotel.beds >= filters.beds);
  const city = destination.name.split(",")[0];
  const [lat, lng] = destination.coordinates;
  const bbox = `${lng - .06},${lat - .04},${lng + .06},${lat + .04}`;

  useEffect(() => {
    const oldTitle = document.title;
    document.title = `${destination.name} Hotels | STAY`;
    return () => { document.title = oldTitle; };
  }, [destination.name]);

  return (
    <>
      <section className="city-hero container">
        <div className="hero-glow" />
        <div className="city-copy">
          <button className="city-back" onClick={onHome}>← Back to destinations</button>
          <h1>{destination.name}</h1>
          <div className="city-meta"><span><Icon name="pin" size={21} />{destination.country}</span><span><Icon name="clipboard" size={21} />{hotels.length} hotels</span></div>
        </div>
        <div className="city-gallery"><img src={photo(destination.image)} alt={destination.name} /><img src={photo("photo-1611892440504-42a792e24d32")} alt="Hotel guest room" /><img src={photo("photo-1566665797739-1674de7a421a")} alt="Hotel suite" /></div>
        {children}
      </section>
      <section className="city-results container" aria-labelledby="city-results-title">
        <div className="city-results-heading"><div><h2 id="city-results-title">{results.length} {results.length === 1 ? "hotel" : "hotels"} in {city}</h2><p>Example hotel rooms · availability is not live</p></div><button className="city-map-button" aria-pressed={showMap} onClick={() => setShowMap(!showMap)}>{showMap ? "Hide map" : "Show map"}<Icon name="globe" size={19} /></button></div>
        <HotelFilters filters={filters} onChange={setFilters} />
        <div className={`city-results-layout${showMap ? " with-map" : ""}`}>
          <div className="city-hotel-grid">
            {results.map((hotel) => <StayCard key={hotel.id} stay={hotel} isSaved={saved.includes(hotel.id)} onToggleSaved={() => onToggleSaved(hotel.id)} onOpenHotel={onOpenHotel} />)}
            {results.length === 0 && <div className="city-empty"><h3>No hotels match these filters</h3><p>Try a higher nightly budget or fewer beds.</p><button className="outline-button" onClick={() => setFilters({ ...DEFAULT_FILTERS })}>Reset filters</button></div>}
          </div>
          {showMap && <aside className="city-map"><iframe title={`Map of ${city}`} src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`} loading="lazy" /><a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=13/${lat}/${lng}`} target="_blank" rel="noreferrer">Open {city} map ↗</a></aside>}
        </div>
      </section>
      <section className="city-favorites container">
        <h2>Guest favorites in {city}</h2>
        <p>Explore highly rated example hotel rooms</p>
        <div className="city-favorites-grid">
          {[...hotels].sort((a, b) => b.rating - a.rating).map((hotel) => <article key={hotel.id}><img src={photo(hotel.image, 180)} alt="" loading="lazy" /><h3>{hotel.name}</h3><p>{hotel.city}</p><span>★ {hotel.rating.toFixed(1)} ({hotel.reviews})</span></article>)}
        </div>
        <button className="dark-button" onClick={() => document.getElementById("city-results-title").scrollIntoView({ behavior: "smooth" })}>Explore hotels</button>
      </section>
    </>
  );
}
