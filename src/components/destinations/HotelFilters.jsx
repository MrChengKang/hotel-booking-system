import { useEffect, useRef, useState } from "react";
import Icon from "../common/Icon";
import { usePreferences } from "../../context/PreferencesContext";

export const DEFAULT_FILTERS = { roomType: "All rooms", maxPrice: 500, beds: 0 };

export default function HotelFilters({ filters, onChange }) {
  const [panel, setPanel] = useState(null);
  const container = useRef(null);
  useEffect(() => {
    if (!panel) return;
    const dismiss = (event) => { if (!container.current.contains(event.target)) setPanel(null); };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [panel]);
  const { formatPrice } = usePreferences();
  const activeCount = Number(filters.roomType !== "All rooms") + Number(filters.maxPrice < 500) + Number(filters.beds > 0);
  const update = (field, value) => onChange({ ...filters, [field]: value });

  return (
    <div ref={container} className="hotel-filters">
      {[["all", `All filters${activeCount ? ` (${activeCount})` : ""}`], ["type", filters.roomType === "All rooms" ? "Room type" : filters.roomType], ["price", "Price per night"], ["beds", filters.beds ? `${filters.beds}+ beds` : "Rooms & beds"]].map(([key, title]) => (
        <button className={`hotel-filter-pill${panel === key ? " is-active" : ""}`} key={key} aria-expanded={panel === key} onClick={() => setPanel(panel === key ? null : key)}>
          {key === "all" && <Icon name="search" size={16} />}{title}<Icon name="down" size={15} />
        </button>
      ))}
      {activeCount > 0 && <button className="hotel-filter-reset" onClick={() => onChange({ ...DEFAULT_FILTERS })}>Reset filters</button>}
      {panel && (
        <div className="hotel-filter-panel" role="dialog" aria-label="Filter hotels" onKeyDown={(event) => { if (event.key === "Escape") setPanel(null); }}>
          {(panel === "all" || panel === "type") && <label>Room type<select aria-label="Room type" value={filters.roomType} onChange={(event) => update("roomType", event.target.value)}>{["All rooms", "Standard room", "Deluxe room", "Suite", "Family room"].map((type) => <option key={type}>{type}</option>)}</select></label>}
          {(panel === "all" || panel === "price") && <label>Maximum per night: {formatPrice(filters.maxPrice)}<input aria-label="Maximum nightly price" type="range" min="50" max="500" step="10" value={filters.maxPrice} onChange={(event) => update("maxPrice", Number(event.target.value))} /></label>}
          {(panel === "all" || panel === "beds") && <label>Minimum beds<select aria-label="Minimum beds" value={filters.beds} onChange={(event) => update("beds", Number(event.target.value))}>{[0, 1, 2, 3].map((beds) => <option key={beds} value={beds}>{beds === 0 ? "Any" : `${beds}+ beds`}</option>)}</select></label>}
          <button className="dark-button" onClick={() => setPanel(null)}>Show hotels</button>
        </div>
      )}
    </div>
  );
}
