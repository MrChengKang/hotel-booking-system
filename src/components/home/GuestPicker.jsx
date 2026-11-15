import { useTranslation } from "../../i18n";
import { useEffect, useRef } from "react";
import { countGuests, GUEST_TYPES, MAX_GUESTS } from "../../utils/guests";
import "./GuestPicker.css";

export default function GuestPicker({ guests, onChange, maxGuests = MAX_GUESTS }) {
  const { t } = useTranslation();
  const picker = useRef(null);
  const total = countGuests(guests);

  useEffect(() => {
    picker.current.querySelector("button:not(:disabled)")?.focus();
  }, []);

  return (
    <div ref={picker} className="guest-popover" role="dialog" aria-label={t("Select guests")}>
      {GUEST_TYPES.map(({ key, title, description, singular, min }) => (
        <div className="guest-row" role="group" aria-label={t(title)} key={key}>
          <div className="guest-description">
            <span className="guest-type-title">{t(title)}</span>
            <span className="guest-age">{t(description)}</span>
          </div>
          <div className="guest-stepper">
            <button
              type="button"
              aria-label={t(`Remove ${singular}`)}
              disabled={guests[key] <= min}
              onClick={() => onChange(key, -1)}
            >
              <span aria-hidden="true">−</span>
            </button>
            <span className="guest-count" aria-label={t(`${title} count`)} aria-live="polite" aria-atomic="true">{guests[key]}</span>
            <button
              type="button"
              aria-label={t(`Add ${singular}`)}
              disabled={total >= maxGuests}
              onClick={() => onChange(key, 1)}
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

