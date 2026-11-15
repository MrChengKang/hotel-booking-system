import { useTranslation } from "../../i18n";
import { useEffect, useId, useRef, useState } from "react";
import Icon from "../common/Icon";
import { addDays, dateKey, nightsBetween, parseDate, todayKey } from "../../utils/dates";
import "./DateRangePicker.css";
import { usePreferences } from "../../context/PreferencesContext";

function monthStart(value) {
  const date = parseDate(value);
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function moveMonth(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
}

function monthWeeks(month) {
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((month.getDay() + days) / 7) * 7 }, (_, index) => {
    const day = index - month.getDay() + 1;
    return day > 0 && day <= days ? new Date(month.getFullYear(), month.getMonth(), day, 12) : null;
  });
  return Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
}

export default function DateRangePicker({ checkIn, checkOut, onChange, onComplete, minDate = todayKey(), inline = false, autoFocus = true }) {
  const { t } = useTranslation();
  const instructionId = useId();
  const { language } = usePreferences();
  const weekDates = Array.from({ length: 7 }, (_, index) => new Date(2026, 10, index + 1, 12));
  const weekdays = weekDates.map((date) => date.toLocaleDateString(language, { weekday: "short" }));
  const fullWeekdays = weekDates.map((date) => date.toLocaleDateString(language, { weekday: "long" }));
  const initialDate = checkIn && checkIn >= minDate ? checkIn : minDate;
  const [month, setMonth] = useState(() => monthStart(initialDate));
  const [focusedDay, setFocusedDay] = useState(initialDate);
  const [hoveredDay, setHoveredDay] = useState(null);
  const dayButtons = useRef(new Map());
  const focusRequested = useRef(autoFocus);
  const lastCheckIn = useRef(checkIn);
  const selectingEnd = Boolean(checkIn && !checkOut);
  const previewEnd = selectingEnd && hoveredDay > checkIn ? hoveredDay : checkOut;
  const months = [month, moveMonth(month, 1)];
  const canGoBack = dateKey(month) > dateKey(monthStart(minDate));
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;

  useEffect(() => {
    if (focusRequested.current) {
      dayButtons.current.get(focusedDay)?.focus();
      focusRequested.current = false;
    }
  }, [focusedDay, month]);

  useEffect(() => {
    if (lastCheckIn.current !== checkIn) {
      lastCheckIn.current = checkIn;
      if (checkIn) {
        setMonth(monthStart(checkIn));
        setFocusedDay(checkIn);
      }
    }
  }, [checkIn]);

  function selectDate(value) {
    if (!selectingEnd || value <= checkIn) {
      onChange(value, "");
    } else {
      onChange(checkIn, value);
      onComplete();
    }
    setHoveredDay(null);
  }

  function navigateMonth(amount) {
    const nextMonth = moveMonth(month, amount);
    const firstDay = dateKey(nextMonth);
    setMonth(nextMonth);
    setFocusedDay(firstDay < minDate ? minDate : firstDay);
    setHoveredDay(null);
  }

  function handleDayKey(event, value) {
    const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const weekday = parseDate(value).getDay();
    const amount = event.key === "Home" ? -weekday : event.key === "End" ? 6 - weekday : offset[event.key];
    if (amount === undefined) return;
    event.preventDefault();
    const next = addDays(value, amount);
    if (next < minDate || next === value) return;
    const nextMonth = monthStart(next);
    // One-month keyboard navigation also works when mobile hides the second month.
    if (dateKey(nextMonth) !== dateKey(monthStart(value))) setMonth(nextMonth);
    focusRequested.current = true;
    setFocusedDay(next);
    if (selectingEnd) setHoveredDay(next);
  }

  return (
    <div className={`date-range-picker${inline ? " date-range-picker-inline" : ""}`} role={inline ? "group" : "dialog"} aria-label={inline ? t("Availability calendar") : t("Choose stay dates")} aria-describedby={instructionId}>
      <div className="calendar-navigation">
        <button type="button" aria-label={t("Previous month")} disabled={!canGoBack} onClick={() => navigateMonth(-1)}>
          <Icon name="chevron" size={20} />
        </button>
        <button type="button" aria-label={t("Next month")} onClick={() => navigateMonth(1)}>
          <Icon name="chevron" size={20} />
        </button>
      </div>
      <div className="calendar-months" onMouseLeave={() => setHoveredDay(null)}>
        {months.map((visibleMonth, monthIndex) => {
          const title = visibleMonth.toLocaleDateString(language, { month: "long", year: "numeric" });
          return (
            <div className={`calendar-month calendar-month-${monthIndex + 1}`} key={dateKey(visibleMonth)}>
              <h3>{title}</h3>
              <table aria-label={title}>
                <thead><tr>{weekdays.map((day, index) => <th scope="col" key={day} abbr={fullWeekdays[index]}>{day}</th>)}</tr></thead>
                <tbody>
                  {monthWeeks(visibleMonth).map((week, index) => (
                    <tr key={index}>
                      {week.map((date, dayIndex) => {
                        if (!date) return <td key={`empty-${dayIndex}`} />;
                        const value = dateKey(date);
                        const start = value === checkIn;
                        const end = value === checkOut;
                        const inRange = Boolean(checkIn && previewEnd && value >= checkIn && value <= previewEnd);
                        const label = date.toLocaleDateString(language, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
                        return (
                          <td key={value} className={[inRange ? "range-day" : "", start ? "range-start" : "", end ? "range-end" : ""].filter(Boolean).join(" ")}>
                            <button
                              ref={(element) => { if (element) dayButtons.current.set(value, element); else dayButtons.current.delete(value); }}
                              type="button"
                              className={start || end ? "selected-day" : ""}
                              aria-label={label}
                              aria-pressed={start || end}
                              aria-current={value === minDate ? "date" : undefined}
                              disabled={value < minDate}
                              tabIndex={focusedDay === value ? 0 : -1}
                              onClick={() => { setFocusedDay(value); selectDate(value); }}
                              onKeyDown={(event) => handleDayKey(event, value)}
                              onMouseEnter={() => selectingEnd && setHoveredDay(value)}
                            >
                              {date.getDate()}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      <div className="calendar-footer">
        <p id={instructionId} aria-live="polite">
          {selectingEnd ? t("Select your check-out date") : checkIn && checkOut ? t("count.selectedNights", { count: nights }) : t("Select your check-in date")}
        </p>
        <button type="button" className="calendar-done" disabled={!checkIn || !checkOut} onClick={onComplete}>{t("Done")}</button>
      </div>
    </div>
  );
}

