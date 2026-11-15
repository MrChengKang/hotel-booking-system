export const languages = [
  { code: "en-US", name: "English", country: "United States" },
  { code: "ja-JP", name: "日本語", country: "日本" },
  { code: "zh-TW", name: "繁體中文", country: "台灣" },
  { code: "ms-MY", name: "Bahasa Melayu", country: "Malaysia" },
  { code: "ko-KR", name: "한국어", country: "대한민국" },
  { code: "fr-FR", name: "Français", country: "France" },
];

// Preview conversion factors for the sample USD room prices, not live exchange rates.
export const currencies = [
  { code: "USD", name: "US Dollar", rate: 1 },
  { code: "JPY", name: "Japanese Yen", rate: 150 },
  { code: "TWD", name: "New Taiwan Dollar", rate: 32 },
  { code: "MYR", name: "Malaysian Ringgit", rate: 4.4 },
  { code: "KRW", name: "South Korean Won", rate: 1350 },
  { code: "EUR", name: "Euro", rate: 0.92 },
];

export const DEFAULT_PREFERENCES = { language: "en-US", currency: "USD" };
