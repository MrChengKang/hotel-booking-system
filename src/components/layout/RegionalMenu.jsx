import { useTranslation } from "../../i18n";
import { useEffect, useRef, useState } from "react";
import Icon from "../common/Icon";
import { currencies, languages } from "../../data/regionalSettings";
import { usePreferences } from "../../context/PreferencesContext";
import "./RegionalMenu.css";

export default function RegionalMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("language");
  const container = useRef(null);
  const trigger = useRef(null);
  const activeTab = useRef(null);
  const { language, currency, setLanguage, setCurrency } = usePreferences();

  useEffect(() => {
    if (!open) return;
    activeTab.current?.focus();
    function dismiss(event) {
      if (!container.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current.focus();
  }

  function switchTab(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextTab = event.key === "Home" ? "language" : event.key === "End" ? "currency" : tab === "language" ? "currency" : "language";
    setTab(nextTab);
    container.current.querySelector(`#regional-${nextTab}-tab`).focus();
  }

  return (
    <div
      ref={container}
      className="regional-control"
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
      onKeyDown={(event) => { if (event.key === "Escape" && open) { event.preventDefault(); close(); } }}
    >
      <button
        ref={trigger}
        className="regional-trigger"
        aria-label={t("Language and currency")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? "regional-menu" : undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); } }}
      >
        <Icon name="globe" size={19} />
        <span className="regional-separator" aria-hidden="true">/</span>
        <Icon name="money" size={19} className="regional-money" />
        <span className="regional-currency-code">{currency}</span>
        <Icon name="down" size={14} className={`regional-chevron${open ? " is-open" : ""}`} />
      </button>
      {open && (
        <div id="regional-menu" className="regional-menu" role="dialog" aria-label={t("Language and currency settings")}>
          <div className="regional-heading">
            <div><h2>{t("Make yourself at home")}</h2><p>{t("Choose your regional preferences")}</p></div>
            <button type="button" className="regional-close" aria-label={t("Close regional settings")} onClick={close}>×</button>
          </div>
          <div className="regional-tabs" role="tablist" aria-label={t("Regional settings")} onKeyDown={switchTab}>
            {["language", "currency"].map((item) => (
              <button
                ref={tab === item ? activeTab : null}
                key={item}
                id={`regional-${item}-tab`}
                role="tab"
                aria-selected={tab === item}
                aria-controls={`regional-${item}-panel`}
                tabIndex={tab === item ? 0 : -1}
                onClick={() => setTab(item)}
              >{item === "language" ? t("Language") : t("Currency")}</button>
            ))}
          </div>
          <div role="tabpanel" id={`regional-${tab}-panel`} aria-labelledby={`regional-${tab}-tab`}>
            <div className="regional-options" role="group" aria-label={tab === "language" ? t("Languages") : t("Currencies")}>
              {(tab === "language" ? languages : currencies).map((item) => {
                const selected = tab === "language" ? item.code === language : item.code === currency;
                return (
                  <button
                    key={item.code}
                    className={`regional-option${selected ? " is-selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => tab === "language" ? setLanguage(item.code) : setCurrency(item.code)}
                  >
                    <span><strong lang={tab === "language" ? item.code : undefined}>{tab === "language" ? item.name : item.code}</strong><small>{tab === "language" ? item.country : t(item.name)}</small></span>
                    {selected && <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 13 4 4L19 6" /></svg>}
                  </button>
                );
              })}
            </div>
            <p className="regional-note"><Icon name={tab === "currency" ? "money" : "globe"} size={16} /><span>{tab === "currency" ? t("Sample prices use your preferred currency. Hotel bookings are charged in the hotel’s currency.") : t("Changes website text, dates and number formats. Hotel descriptions and guest reviews stay in their original language.")}</span></p>
          </div>
          <div className="regional-footer"><span>{t("Preferences saved automatically")}</span><button type="button" onClick={close}>{t("Done")}</button></div>
        </div>
      )}
    </div>
  );
}
