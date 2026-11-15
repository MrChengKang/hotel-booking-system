import { useTranslation } from "../../i18n";
import { useEffect, useRef, useState } from "react";
import Icon from "../common/Icon";
import { useHotelDestinations } from "../../context/HotelDestinationsContext";
import { addDays, todayKey } from "../../utils/dates";
import { usePreferences } from "../../context/PreferencesContext";
import DateRangePicker from "./DateRangePicker";
import GuestPicker from "./GuestPicker";
import { countGuests, DEFAULT_GUESTS, updateGuestCount } from "../../utils/guests";
import "./BookingSearch.css";

export default function BookingSearch({
  location,
  onLocationChange,
  locationInput,
  panel,
  onPanelChange,
  onNotify,
  onSearch,
}) {
  const { t } = useTranslation();
  const { formatDate } = usePreferences();
  const destinations = useHotelDestinations().data || [];
  const [checkIn, setCheckIn] = useState(todayKey);
  const [checkOut, setCheckOut] = useState(() => addDays(todayKey(), 3));
  const [guests, setGuests] = useState(() => ({ ...DEFAULT_GUESTS }));
  const totalGuests = countGuests(guests);
  const dateField = useRef(null);
  const dateTrigger = useRef(null);
  const guestField = useRef(null);
  const guestTrigger = useRef(null);

  useEffect(() => {
    if (panel !== "dates" && panel !== "guests") return;
    function dismiss(event) {
      const field = panel === "dates" ? dateField : guestField;
      if (!field.current?.contains(event.target)) onPanelChange(null);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [panel, onPanelChange]);

  function changeDates(start, end) {
    setCheckIn(start);
    setCheckOut(end);
  }

  function closeCalendar() {
    onPanelChange(null);
    dateTrigger.current.focus();
  }

  function search(e) {
    e.preventDefault();
    if (!location.trim()) {
      locationInput.current.focus();
      return;
    }
    if (!checkIn || !checkOut || checkIn < todayKey() || checkOut <= checkIn) {
      onNotify(t("Please select your check-in and check-out dates."));
      onPanelChange("dates");
      return;
    }
    onPanelChange(null);
    onSearch?.({ location, checkIn, checkOut, guests });
    onNotify(
      t("Hotels in {{location}} · {{start}} – {{end}} · {{guests}}. Your hotel search is ready.", { location, start: formatDate(checkIn), end: formatDate(checkOut), guests: t("count.guests", { count: totalGuests }) }),
    );
  }

  return (
    <div className="booking">
      <form className="search-bar" onSubmit={search}>
        <label className="search-field location-field">
          <Icon name="pin" />
          <span>
            <span className="field-title">{t("Location")}</span>
            <input
              ref={locationInput}
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder={t("Where are you going?")}
              aria-label={t("Destination")}
              list="destinations-list"
            />
            <datalist id="destinations-list">
              {destinations.map((d) => (
                <option key={d.city} value={d.city} />
              ))}
            </datalist>
          </span>
        </label>
        <div
          ref={dateField}
          className={`search-field date-field${panel === "dates" ? " date-field-active" : ""}`}
          onKeyDown={(event) => {
            if (event.key === "Escape" && panel === "dates") {
              event.preventDefault();
              closeCalendar();
            }
          }}
        >
          <Icon name="calendar" />
          <button
            type="button"
            ref={dateTrigger}
            className="field-button"
            aria-label={t("Check-in and check-out dates")}
            aria-haspopup="dialog"
            onClick={() => onPanelChange(panel === "dates" ? null : "dates")}
            aria-expanded={panel === "dates"}
          >
            <span className="field-title">
              {checkIn ? `${formatDate(checkIn)} - ${checkOut ? formatDate(checkOut) : t("Check out")}` : t("Add dates")}
            </span>
            <span className="field-hint">{t("Check in - Check out")}</span>
          </button>
          {panel === "dates" && checkIn && (
            <button
              type="button"
              className="clear-dates"
              aria-label={t("Clear dates")}
              onClick={() => { changeDates("", ""); closeCalendar(); }}
            >
              ×
            </button>
          )}
          {panel === "dates" && (
            <DateRangePicker
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={changeDates}
              onComplete={closeCalendar}
            />
          )}
        </div>
        <div
          ref={guestField}
          className={`search-field guest-field${panel === "guests" ? " guest-field-active" : ""}`}
          onKeyDown={(event) => {
            if (event.key === "Escape" && panel === "guests") {
              event.preventDefault();
              onPanelChange(null);
              guestTrigger.current.focus();
            }
          }}
        >
          <Icon name="guests" />
          <button
            type="button"
            ref={guestTrigger}
            className="field-button"
            aria-haspopup="dialog"
            onClick={() => onPanelChange(panel === "guests" ? null : "guests")}
            aria-expanded={panel === "guests"}
          >
            <span className="field-title">{t("count.guests", { count: totalGuests })}</span>
            <span className="field-hint">{t("Guests")}</span>
          </button>
          {panel === "guests" && (
            <>
              <button
                type="button"
                className="reset-guests"
                aria-label={t("Reset guests")}
                onClick={() => setGuests({ ...DEFAULT_GUESTS })}
              >×</button>
              <GuestPicker
                guests={guests}
                onChange={(type, amount) => setGuests((current) => updateGuestCount(current, type, amount))}
              />
            </>
          )}
        </div>
        <button
          className="search-submit"
          aria-label={t("Search")}
          type="submit"
        >
          <Icon name="search" size={26} />
        </button>
      </form>
    </div>
  );
}

