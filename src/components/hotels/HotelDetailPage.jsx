import { useEffect, useState } from "react";
import HotelGallery from "./HotelGallery";
import ReservationCard from "./ReservationCard";
import HotelReviews from "./HotelReviews";
import DateRangePicker from "../home/DateRangePicker";
import Icon from "../common/Icon";
import { getHotelDetails, hotelAmenities } from "../../data/hotelDetails";
import { addDays, todayKey } from "../../utils/dates";
import { DEFAULT_GUESTS } from "../../utils/guests";
import { usePreferences } from "../../context/PreferencesContext";
import "./HotelDetailPage.css";

export default function HotelDetailPage({ hotel: source, isSaved, onToggleSaved, onBack, onNotify }) {
  const hotel = getHotelDetails(source);
  const [dates, setDates] = useState(() => ({ start: todayKey(), end: addDays(todayKey(), 3) }));
  const [guests, setGuests] = useState({ ...DEFAULT_GUESTS });
  const [allAmenities, setAllAmenities] = useState(false);
  const { formatPrice } = usePreferences();
  const changeDates = (start, end) => setDates({ start, end });
  useEffect(() => { const old = document.title; document.title = `${hotel.name} | STAY`; return () => { document.title = old; }; }, [hotel.name]);

  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); onNotify("Hotel link copied."); }
    catch { onNotify(`Hotel link: ${window.location.href}`); }
  }

  return (
    <div className="hotel-detail container">
      <button className="city-back" onClick={onBack}>← Back to {hotel.city} hotels</button>
      <HotelGallery hotel={hotel} />
      <div className="hotel-detail-layout">
        <div className="hotel-detail-content">
          <section className="hotel-detail-panel hotel-overview"><div className="hotel-overview-tools"><span className="hotel-room-badge">Hotel room</span><div><button
            className="hotel-round-button"
            aria-label="Save this hotel"
            aria-pressed={isSaved}
            onClick={onToggleSaved}
          ><Icon name="heart" style={isSaved ? { fill: "#fb7185", color: "#fb7185" } : undefined} /></button><button className="hotel-round-button" aria-label="Share hotel link" onClick={copyLink}><Icon name="share" size={20} /></button></div></div><h1>{hotel.name}</h1><div className="hotel-summary-line"><span><span className="hotel-star">★</span> {hotel.rating.toFixed(1)} <small>({hotel.reviews})</small></span><span><Icon name="pin" size={19} />{hotel.address}, {hotel.city}</span></div><p className="hotel-managed">Managed by <strong>{hotel.city} hotel guest services</strong></p><div className="hotel-room-facts"><span><Icon name="guests" />Up to {hotel.capacity} guests</span><span><Icon name="bed" />{hotel.beds} {hotel.beds === 1 ? "bed" : "beds"}</span><span><Icon name="bath" />1 bath</span><span><Icon name="clipboard" />1 bedroom</span></div></section>
          <section className="hotel-detail-panel" id="hotel-about"><h2>About this hotel room</h2><p>{hotel.description}</p><hr /><h2>Rates</h2><p>Example nightly rates and fees for this room.</p><dl className="hotel-rate-list"><div><dt>Every night</dt><dd>{formatPrice(hotel.price)}</dd></div><div><dt>Cleaning, once per stay</dt><dd>{formatPrice(45)}</dd></div><div><dt>Service fee</dt><dd>10% of the room subtotal</dd></div><div><dt>Taxes</dt><dd>8% of room and fees</dd></div><div><dt>Guests</dt><dd>Up to {hotel.capacity}</dd></div></dl></section>
          <section className="hotel-detail-panel"><h2>Amenities</h2><p>Comforts for a relaxing hotel stay</p><div className="hotel-amenities">{hotelAmenities.slice(0, allAmenities ? hotelAmenities.length : 9).map(([name, icon]) => <span key={name}><Icon name={icon} size={22} />{name}</span>)}</div><button
            className="outline-button"
            aria-expanded={allAmenities}
            onClick={() => setAllAmenities(!allAmenities)}
          >{allAmenities ? "Show fewer amenities" : `Show all ${hotelAmenities.length} amenities`}</button></section>
          <section className="hotel-detail-panel hotel-availability"><h2>Availability</h2><p>Choose your dates and the total updates with them.</p><p className="hotel-muted">Dates are selectable for this preview; live room availability is not connected.</p><DateRangePicker
            inline
            autoFocus={false}
            checkIn={dates.start}
            checkOut={dates.end}
            onChange={changeDates}
            onComplete={() => {}}
          /></section>
        </div>
        <ReservationCard
          hotel={hotel}
          dates={dates}
          onDatesChange={changeDates}
          guests={guests}
          onGuestsChange={setGuests}
        />
      </div>
      <HotelReviews hotel={hotel} />
    </div>
  );
}
