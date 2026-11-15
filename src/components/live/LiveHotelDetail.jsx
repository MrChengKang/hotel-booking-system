import { useTranslation } from "../../i18n";
import { useState } from "react";
import { getHotel, getRoomTypes } from "../../services/hotelApi";
import useResource from "../../hooks/useResource";
import { addDays } from "../../utils/dates";
import { hotelToday, money } from "../../utils/liveBooking";
import HotelReviews from "../reviews/HotelReviews";
import HotelPhotos from "./HotelPhotos";
import { usePreferences } from "../../context/PreferencesContext";
import LiveReservation from "./LiveReservation";
import RequestState from "./RequestState";
import "../hotels/HotelDetailPage.css";
import "./LiveBooking.css";
import { hotelAmenities } from "../../data/hotelAmenities";
import "./HotelSearchForm.css";

export default function LiveHotelDetail({ id, params, onBack, onLogin, onBooked, savedHotels, onToggleSaved, savingIds = [] }) {
  const { t } = useTranslation();
  const resource = useResource(id, signal => Promise.all([getHotel(id, signal), getRoomTypes(id, signal)]));
  return <div className="container hotel-detail"><button className="city-back" onClick={onBack}>{t("← Back to hotels")}</button><RequestState resource={resource} loading={t("Loading hotel and room types…")} />{resource.status === "error" && resource.error.status === 404 && <p>{t("This hotel may no longer be published.")}</p>}{resource.status === "ready" && <HotelContent key={id} hotel={resource.data[0]} roomTypes={resource.data[1]} params={params} onLogin={onLogin} onBooked={onBooked} savedHotels={savedHotels} onToggleSaved={onToggleSaved} savingIds={savingIds} />}</div>;
}

function HotelContent({ hotel, roomTypes, params, onLogin, onBooked, savedHotels, onToggleSaved, savingIds = [] }) {
  const { t } = useTranslation();
  const today = hotelToday(hotel.timeZone);
  const [draft, setDraft] = useState(() => ({ checkIn: params.get("checkIn") || today, checkOut: params.get("checkOut") || addDays(today, 3), rooms: params.get("rooms") || "1", guests: params.get("guests") || "2", roomTypeId: params.get("roomTypeId") || "" }));
  const { language } = usePreferences();
  return <>
    <HotelPhotos hotelId={hotel.id} name={hotel.name} cover={hotel.coverImageUrl} />
    <div className="hotel-detail-layout"><div className="hotel-detail-content">
      <section className="hotel-detail-panel"><div className="live-section-heading"><span className="hotel-room-badge">{t("Hotel")}</span><button className="outline-button" disabled={savingIds.includes(hotel.id)} aria-label={t("Save this hotel")} aria-pressed={savedHotels.some(item => item.id === hotel.id)} onClick={() => onToggleSaved(hotel)}>{savedHotels.some(item => item.id === hotel.id) ? t("♥ Saved") : t("♡ Save")}</button></div><h1>{hotel.name}</h1><p>{hotel.address}, {hotel.city}, {hotel.countryCode}</p><p className="hotel-muted">{t("Hotel time zone:")}{" "}{hotel.timeZone}</p></section>
      <section className="hotel-detail-panel"><h2>{t("About this hotel")}</h2><p className="live-description">{hotel.description || t("The hotel has not added a description yet.")}</p></section>
      {hotel.amenities?.length > 0 && <section className="hotel-detail-panel"><h2>{t("Facilities")}</h2><ul className="live-amenity-list">{hotelAmenities.filter(([code]) => hotel.amenities.includes(code)).map(([code, label]) => <li key={code}>{t(label)}</li>)}</ul></section>}
      <section className="hotel-detail-panel"><h2>{t("Choose your room")}</h2><p>{t("Rates vary by date. Check live availability before reserving.")}</p><div className="live-room-list">{roomTypes.length ? roomTypes.map(room => <article className="live-room" key={room.id}><HotelPhotos hotelId={hotel.id} roomId={room.id} name={room.name} cover={room.coverImageUrl} /><h3>{room.name}</h3><p className="live-description">{room.description}</p><p>{t("Up to {{guests}} guests per room · {{beds}} beds", { guests: room.maxGuests, beds: room.beds })}</p><p>{t("Base rate: {{price}} / night", { price: money(room.basePrice, hotel.currencyCode, language) })}</p><button className="outline-button" onClick={() => { setDraft(d => ({ ...d, roomTypeId: String(room.id) })); document.getElementById("hotel-reservation")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>{t("Select {{name}}", { name: room.name })}</button></article>) : <p>{t("No active room types have been published yet.")}</p>}</div></section>
      <section className="hotel-detail-panel"><h2>{t("Booking information")}</h2><p>{t("The total is calculated from the hotel’s nightly inventory prices. No demo cleaning fees or estimated taxes are added.")}</p><p>{t("Paid bookings can request a full sandbox refund before midnight on the hotel's local check-in date. Rooms are released only after refund success.")}</p></section>
      <HotelReviews hotelId={hotel.id} />
    </div><LiveReservation hotel={hotel} roomTypes={roomTypes} draft={draft} onChange={setDraft} onLogin={onLogin} onBooked={onBooked} /></div>
  </>;
}
