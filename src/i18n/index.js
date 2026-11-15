import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en-US.json";
import ja from "./locales/ja-JP.json";
import zh from "./locales/zh-TW.json";
import ms from "./locales/ms-MY.json";
import ko from "./locales/ko-KR.json";
import fr from "./locales/fr-FR.json";

export const supportedLanguages = ["en-US", "ja-JP", "zh-TW", "ms-MY", "ko-KR", "fr-FR"];
function initialLanguage() {
  try {
    const saved = JSON.parse(localStorage.getItem("stay-preferences"))?.language;
    return supportedLanguages.includes(saved) ? saved : "en-US";
  } catch { return "en-US"; }
}

i18n.use(initReactI18next).init({
  resources: Object.fromEntries(Object.entries({ "en-US": en, "ja-JP": ja, "zh-TW": zh, "ms-MY": ms, "ko-KR": ko, "fr-FR": fr }).map(([language, translation]) => [language, { translation }])),
  lng: initialLanguage(),
  fallbackLng: "en-US",
  supportedLngs: supportedLanguages,
  keySeparator: false,
  nsSeparator: false,
  initImmediate: false,
  interpolation: { escapeValue: false }, // React escapes text and interpolated values.
  react: { useSuspense: false },
});

function updateDocument(language) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
    document.title = i18n.t("STAY — Hotel booking", { lng: language });
  }
}
i18n.on("languageChanged", updateDocument);
updateDocument(i18n.language);

// Only translate known server messages; retain unknown details in English instead
// of guessing their meaning or replacing a useful failure with a success message.
export function localizeError(message, t = i18n.t.bind(i18n)) {
  return message ? t(message, { defaultValue: message }) : t("Something went wrong. Please try again.");
}

export { useTranslation } from "react-i18next";
export default i18n;
