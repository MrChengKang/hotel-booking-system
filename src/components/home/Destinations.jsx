import { useTranslation } from "../../i18n";
import { useHotelDestinations } from "../../context/HotelDestinationsContext";
import { HotelCover } from "../live/HotelPhotos";
import RequestState from "../live/RequestState";
import "./Destinations.css";

export default function Destinations({ onSelectDestination, onBrowseAll }) {
  const { t } = useTranslation();
  const resource = useHotelDestinations();
  const destinations = resource.data || [];
  return (
    <section className="destinations container" id="destinations" aria-labelledby="hotel-destinations-title">
      <div className="destination-heading">
        <div><h2 id="hotel-destinations-title">{t("Find your next hotel")}</h2>
          <p className="section-subtitle">{t("Explore destinations with hotels on STAY.")}</p></div>
        {onBrowseAll && <button className="outline-button" onClick={onBrowseAll}>{t("View all hotels")}</button>}
      </div>
      <RequestState resource={resource} loading={t("Loading destinations…")} />
      {resource.status === "ready" && (destinations.length ? (
        <div className={`live-destination-grid${destinations.length === 1 ? " is-single" : ""}`} style={{ "--destination-columns": Math.min(destinations.length, 4) }}>
          {destinations.map(destination => (
            <a className="live-destination-card" key={destination.city} href={`/hotels?${new URLSearchParams({ city: destination.city })}`} onClick={event => {
              if (onSelectDestination && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
                event.preventDefault(); onSelectDestination(destination.city);
              }
            }}>
              <div className="destination-cover"><HotelCover key={destination.coverImageUrl || destination.city} url={destination.coverImageUrl} name={destination.city} loading="lazy" /></div>
              <div className="destination-copy"><span className="destination-kicker">{t("Explore hotels")}</span><h3>{destination.city}</h3>
                <p>{t(destination.hotelCount === 1 ? "{{count}} hotel on STAY" : "{{count}} hotels on STAY", { count: destination.hotelCount })}</p>
                <span className="destination-action">{t("View hotels in {{city}}", { city: destination.city })} <span aria-hidden="true">↗</span></span>
              </div>
            </a>
          ))}
        </div>
      ) : <div className="destination-empty"><h3>{t("New destinations are on their way")}</h3><p>{t("Hotels will appear here as they join STAY. Check back soon for your next stay.")}</p></div>)}
    </section>
  );
}
