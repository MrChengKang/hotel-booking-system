import { useTranslation } from "../../i18n";
import { useState } from "react";
import useResource from "../../hooks/useResource";
import { getHotels } from "../../services/hotelApi";
import { money, stayParams } from "../../utils/liveBooking";
import { HotelCover } from "./HotelPhotos";
import RequestState from "./RequestState";
import { usePreferences } from "../../context/PreferencesContext";
import "./LiveBooking.css";

export default function LiveHotelList({ city = "", search = {}, savedHotels = [], savedOnly = false, onSavedOnlyChange, onToggleSaved, onOpenHotel, onBrowseAll, savingIds = [], onPageChange }) {
  const { t } = useTranslation();
  const { language } = usePreferences();
  const [localPage, setLocalPage] = useState(0);
  const page = onPageChange ? Math.max(0, Number(search.page) || 0) : localPage;
  const setPage = onPageChange || setLocalPage;
  const dated = Boolean(search.checkIn && search.checkOut);
  const resource = useResource(savedOnly ? null : JSON.stringify([city, page, search]), signal => getHotels({ ...search, city, page, size: 12 }, signal));
  const items = savedOnly ? savedHotels : resource.data?.items || [];
  const hotelStay = hotel => ({ ...Object.fromEntries(["checkIn", "checkOut", "rooms", "guests"].filter(key => search[key]).map(key => [key, search[key]])), ...(hotel.roomTypeId ? { roomTypeId: hotel.roomTypeId } : {}) });
  const ready = savedOnly || resource.status === "ready";
  return <section className="container live-hotels" aria-labelledby="featured-stays-title">
    <div className="live-section-heading"><div><h2 id="featured-stays-title">{savedOnly ? t("Saved hotels") : city ? t("Hotels in {{city}}", { city }) : t("Featured hotels")}</h2><p>{savedOnly ? t("Saved to your account. Open a hotel to check current rooms.") : t("Published hotels from STAY · availability and prices come from the hotel.")}</p></div>{onBrowseAll && <button className="outline-button" onClick={onBrowseAll}>{t("View all hotels")}</button>}</div>
    {onSavedOnlyChange && <div className="live-tabs"><button aria-pressed={!savedOnly} onClick={() => onSavedOnlyChange(false)}>{t("All hotels")}</button><button aria-pressed={savedOnly} onClick={() => onSavedOnlyChange(true)}>{t("Saved ({{count}})", { count: savedHotels.length })}</button></div>}
    {!savedOnly && <RequestState resource={resource} loading={t("Loading hotels…")} />}
    {ready && items.length === 0 && <div className="live-state"><h3>{savedOnly ? t("No saved hotels yet") : t("No matching hotels")}</h3><p>{savedOnly ? t("Save a hotel using its heart button.") : dated ? t("No hotels match your dates and filters. Try other dates or clear some filters.") : t("No hotels match these filters. Try another destination or clear some filters.")}</p></div>}
    {!savedOnly && ready && <p className="live-result-count" role="status">{t("{{count}} matching hotels", { count: resource.data.totalElements })}</p>}
    {ready && <div className="live-hotel-grid">{items.map(hotel => <article className="live-hotel-card" key={hotel.id}>
      <div className="live-card-photo"><a href={`/hotel/${hotel.id}?${stayParams(hotelStay(hotel))}`} aria-label={t("View {{name}}", { name: hotel.name })} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) { event.preventDefault(); onOpenHotel(hotel, hotelStay(hotel)); } }}><HotelCover key={hotel.coverImageUrl || "none"} url={hotel.coverImageUrl} name={hotel.name} loading="lazy" /></a><button className="live-save" disabled={savingIds.includes(hotel.id)} aria-label={t("Save {{name}}", { name: hotel.name })} aria-pressed={savedHotels.some(item => item.id === hotel.id)} onClick={() => onToggleSaved(hotel)}>{savedHotels.some(item => item.id === hotel.id) ? "♥" : "♡"}</button></div>
      <p className="live-eyebrow">{hotel.city} · {hotel.countryCode}</p><h3><a href={`/hotel/${hotel.id}?${stayParams(hotelStay(hotel))}`} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) { event.preventDefault(); onOpenHotel(hotel, hotelStay(hotel)); } }}>{hotel.name}</a></h3><p>{hotel.address}</p>{hotel.startingNightlyPrice != null && <p className="live-search-price"><strong>{money(hotel.startingNightlyPrice, hotel.currencyCode, language)}</strong>{" "}{t("/ room / night")}<small>{dated ? t("Average for your dates · from") : t("Base rate from · select dates for availability")}</small></p>}<button className="live-text-button" onClick={() => onOpenHotel(hotel, hotelStay(hotel))}>{t("View rooms & availability →")}</button>
    </article>)}</div>}
    {!savedOnly && resource.data && resource.data.totalPages > 1 && <div className="live-pagination"><button className="outline-button" disabled={page === 0} onClick={() => setPage(page - 1)}>{t("Previous hotels")}</button><span>{t("Page {{page}} / {{total}}", { page: page + 1, total: resource.data.totalPages })}</span><button className="outline-button" disabled={page + 1 >= resource.data.totalPages} onClick={() => setPage(page + 1)}>{t("Next hotels")}</button></div>}
  </section>;
}

