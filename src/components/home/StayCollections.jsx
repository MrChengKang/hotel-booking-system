import { useTranslation } from "../../i18n";
import Icon from "../common/Icon";
import RouteLink from "../common/RouteLink";
import "./HomeSections.css";
import "./StayCollections.css";

const collections = [
  { icon: "user", title: "A stay for two", description: "Look for one room with space for two guests.", params: { rooms: 1, guests: 2 }, detail: "1 room · 2 guests" },
  { icon: "guests", title: "Travelling together", description: "Find room types with enough space for your group.", params: { rooms: 2, guests: 4 }, detail: "2 rooms · 4 guests" },
  { icon: "bed", title: "Prefer separate beds?", description: "Start with rooms that have at least two beds.", params: { rooms: 1, guests: 2, minBeds: 2 }, detail: "2+ beds per room" },
];

export default function StayCollections({ onNavigate }) {
  const { t } = useTranslation();
  return <section className="stay-collections container" id="hotel-types" aria-labelledby="stay-collections-title">
    <div className="collections-heading"><span className="collections-eyebrow">{t("Make it your stay")}</span><h2 id="stay-collections-title">{t("Start with the room you need")}</h2><p>{t("These searches use published room details. Add dates to check live availability.")}</p></div>
    <div className="stay-collections-grid">{collections.map(collection => <RouteLink key={collection.title} className="stay-collection" href={`/hotels?${new URLSearchParams(collection.params)}`} onNavigate={onNavigate}>
      <span className="collection-icon"><Icon name={collection.icon} size={25} /></span>
      <span className="collection-detail">{t(collection.detail)}</span><h3>{t(collection.title)}</h3><p>{t(collection.description)}</p><span className="collection-action">{t("Find matching rooms")}<span aria-hidden="true">↗</span></span>
    </RouteLink>)}</div>
  </section>;
}
