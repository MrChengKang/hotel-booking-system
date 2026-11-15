import i18n, { supportedLanguages, localizeError } from "./index";

const placeholders = text => [...text.matchAll(/{{\s*([^}]+)\s*}}/g)].map(match => match[1].trim()).sort();

test.each(supportedLanguages)("%s has complete translations with intact interpolation fields", language => {
  const english = i18n.getResourceBundle("en-US", "translation");
  const translated = i18n.getResourceBundle(language, "translation");
  expect(Object.keys(translated).sort()).toEqual(Object.keys(english).sort());
  for (const key of Object.keys(english)) {
    expect(translated[key].trim()).not.toBe("");
    expect(placeholders(translated[key])).toEqual(placeholders(english[key]));
  }
});

test("quantity labels respect plural rules and English is the fallback", () => {
  const en = i18n.getFixedT("en-US");
  const fr = i18n.getFixedT("fr-FR");
  const zh = i18n.getFixedT("zh-TW");
  expect(en("count.rooms", { count: 1 })).toBe("1 room");
  expect(en("count.rooms", { count: 2 })).toBe("2 rooms");
  expect(fr("count.rooms", { count: 1 })).toBe("1 chambre");
  expect(fr("count.rooms", { count: 2 })).toBe("2 chambres");
  expect(zh("count.guests", { count: 2 })).toBe("2 位住客");
  expect(i18n.getFixedT("it-IT")("Sign in")).toBe("Sign in");
  expect(zh("Select {{name}}", { name: "Hotel {{test}} <A>" })).toBe("選擇 Hotel {{test}} <A>");
});

test("known errors translate while unknown server details remain available", () => {
  const zh = i18n.getFixedT("zh-TW");
  expect(localizeError("Email or password is incorrect.", zh)).toBe("電子郵件或密碼錯誤。");
  expect(localizeError("Unexpected provider error ABC", zh)).toBe("Unexpected provider error ABC");
});
