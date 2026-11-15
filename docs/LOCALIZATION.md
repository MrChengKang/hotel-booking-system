# Website languages

The guest-facing homepage, shared navigation, language/currency menu, login,
registration, password recovery, hotel search, live hotel detail, room selection,
reservation confirmation, My Bookings and sandbox payment states support English
(`en-US`, default/fallback), Japanese (`ja-JP`), Traditional Chinese (`zh-TW`),
Malay (`ms-MY`), Korean (`ko-KR`) and French (`fr-FR`).

`src/i18n/index.js` initializes i18next and react-i18next. Components import
`useTranslation` from this module. Local JSON resources are bundled with the app;
selecting a language doesn't call an external translation service.

The six files in `src/i18n/locales` use full English strings as flat keys
(`keySeparator` and `nsSeparator` are disabled). Quantity labels use named
`count.*_one` and `count.*_other` keys with the numeric `count` option. Dynamic names,
references and prices use `{{placeholders}}`, and React renders them as escaped text.
Keep placeholders identical across languages. English fallback covers missing keys.

`PreferencesProvider` synchronizes the existing `stay-preferences` selection with
i18next; dates and number formats use the same locale. HTML language and page title
update too. Language switching preserves form state, search parameters, room IDs,
authentication roles and server quotes.

Hotel names, addresses, descriptions, room names, real guest reviews and host
responses stay in their original language. Known API errors translate at render
time; unknown server messages retain their original details. Native form validation
uses the browser's language settings.

Currency is a separate preference. Sample prices have fixed illustrative conversion
factors, not live exchange rates. Live bookings/payments always use the hotel's
server-provided currency and amount. Stripe-hosted Checkout chooses its language
using Stripe's own browser locale support, independently of the website selection.

Host Dashboard, account editing, saved-hotels management and the notification inbox
are outside this first translation phase. Shared navigation on those pages follows
the selected language; their remaining content is English.

To add a phrase, call `t("English phrase")` in the component and add the same key to
all six JSON files. Use `localizeError(message, t)` for server errors, and keep raw
errors in state so they update if the language changes after a failure.

Tests check resource/placeholder parity, pluralization, persisted selection, all six
login/register languages, preserved inputs, a Chinese search-to-booking flow,
localized validation errors and a French paid booking that keeps MYR despite a JPY
display preference. API calls are mocked; these tests create no database/payment
provider records.
