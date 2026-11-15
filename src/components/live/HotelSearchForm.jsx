import { useState } from "react";
import { useTranslation } from "../../i18n";
import { currencies } from "../../data/regionalSettings";
import { hotelAmenities } from "../../data/hotelAmenities";
import "./HotelSearchForm.css";

export default function HotelSearchForm({ city, search, onSearch, onClear }) {
  const { t } = useTranslation();
  const [currency, setCurrency] = useState(search.currency || "");
  const [sort, setSort] = useState(search.sort || "newest");
  const [error, setError] = useState("");
  const currencyCodes = [...new Set([...(Intl.supportedValuesOf ? Intl.supportedValuesOf("currency") : [...currencies.map(item => item.code), "GBP", "SGD", "AUD", "CAD", "HKD", "CNY", "CHF", "THB", "INR", "IDR"]), ...(currency ? [currency] : [])])].sort();
  const selected = (search.amenities || "").split(",");
  function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values = Object.fromEntries(data);
    values.amenities = data.getAll("amenities").join(",");
    if (Boolean(values.checkIn) !== Boolean(values.checkOut) || (values.checkIn && values.checkOut <= values.checkIn)) {
      setError(t("Choose a check-out date after check-in.")); return;
    }
    if ((values.minPrice !== "" || values.maxPrice !== "" || sort !== "newest") && !currency) {
      setError(t("Choose a currency for price filters or price sorting.")); return;
    }
    if (values.minPrice !== "" && values.maxPrice !== "" && Number(values.minPrice) > Number(values.maxPrice)) {
      setError(t("Minimum price cannot exceed maximum price.")); return;
    }
    setError(""); onSearch(values);
  }
  return <form className="hotel-search-form" aria-label={t("Search hotels")} onSubmit={submit}>
    <div className="hotel-search-primary">
      <label>{t("City")}<input name="city" defaultValue={city} maxLength={100} placeholder={t("All destinations")} /></label>
      <label>{t("Check in")}<input type="date" name="checkIn" defaultValue={search.checkIn} /></label>
      <label>{t("Check out")}<input type="date" name="checkOut" defaultValue={search.checkOut} /></label>
      <label>{t("Rooms")}<input type="number" name="rooms" min="1" max="20" required defaultValue={search.rooms || 1} /></label>
      <label>{t("Guests")}<input type="number" name="guests" min="1" max="1000" required defaultValue={search.guests || 2} /></label>
    </div>
    <details className="hotel-search-options" open={Boolean(search.currency || search.minPrice || search.maxPrice || Number(search.minBeds) > 0 || search.amenities || (search.sort && search.sort !== "newest"))}>
      <summary>{t("Price, facilities & sorting")}</summary>
      <div className="hotel-search-secondary">
        <label>{t("Hotel currency")}<select name="currency" value={currency} onChange={event => { setCurrency(event.target.value); if (!event.target.value) setSort("newest"); }}><option value="">{t("All currencies")}</option>{currencyCodes.map(code => <option key={code} value={code}>{code}</option>)}</select></label>
        <label>{t("Minimum per night")}<input name="minPrice" type="number" min="0" max="9999999999.99" step="0.01" defaultValue={search.minPrice} placeholder="0" /></label>
        <label>{t("Maximum per night")}<input name="maxPrice" type="number" min="0" max="9999999999.99" step="0.01" defaultValue={search.maxPrice} placeholder={t("No limit")} /></label>
        <label>{t("Minimum beds per room")}<input name="minBeds" type="number" min="0" max="100" required defaultValue={search.minBeds || 0} /></label>
        <label>{t("Sort by")}<select name="sort" value={sort} onChange={event => setSort(event.target.value)}><option value="newest">{t("Newest hotels")}</option><option value="price_asc" disabled={!currency}>{t("Price: low to high")}</option><option value="price_desc" disabled={!currency}>{t("Price: high to low")}</option></select></label>
      </div>
      <p className="hotel-search-note">{t("Choose a hotel currency to compare prices. With dates, prices are the average per room per night; without dates, base rates are shown.")}</p>
      <fieldset className="hotel-search-amenities"><legend>{t("Facilities")}</legend>{hotelAmenities.map(([code, label]) => <label key={code}><input name="amenities" value={code} type="checkbox" defaultChecked={selected.includes(code)} />{t(label)}</label>)}</fieldset>
    </details>
    {error && <p role="alert" className="live-error">{error}</p>}
    <div className="hotel-search-actions"><button className="dark-button" type="submit">{t("Search hotels")}</button><button type="button" className="outline-button" onClick={onClear}>{t("Clear filters")}</button><span>{t("Select dates to see available rooms.")}</span></div>
  </form>;
}
