import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { currencies, DEFAULT_PREFERENCES, languages } from "../data/regionalSettings";
import { parseDate } from "../utils/dates";
import i18n from "../i18n";

const STORAGE_KEY = "stay-preferences";

function readPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      language: languages.some((item) => item.code === stored?.language) ? stored.language : DEFAULT_PREFERENCES.language,
      currency: currencies.some((item) => item.code === stored?.currency) ? stored.currency : DEFAULT_PREFERENCES.currency,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function createPreferences(preferences, setLanguage, setCurrency) {
  const { language, currency } = preferences;
  const rate = currencies.find((item) => item.code === currency).rate;
  return {
    language,
    currency,
    setLanguage,
    setCurrency,
    formatPrice: (usdAmount, decimals = 0) => new Intl.NumberFormat(language, {
      style: "currency", currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: ["JPY", "KRW"].includes(currency) ? 0 : decimals, maximumFractionDigits: ["JPY", "KRW"].includes(currency) ? 0 : decimals,
    }).format(usdAmount * rate),
    formatDate: (value) => parseDate(value).toLocaleDateString(language, { month: "short", day: "2-digit" }),
  };
}

const PreferencesContext = createContext(createPreferences(DEFAULT_PREFERENCES, () => {}, () => {}));

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(readPreferences);

  useEffect(() => { i18n.changeLanguage(preferences.language); }, [preferences.language]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // The current selection remains usable if storage is unavailable.
    }
  }, [preferences]);

  const value = useMemo(() => createPreferences(
    preferences,
    (language) => {
      if (languages.some((item) => item.code === language)) setPreferences((current) => ({ ...current, language }));
    },
    (currency) => {
      if (currencies.some((item) => item.code === currency)) setPreferences((current) => ({ ...current, currency }));
    },
  ), [preferences]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
