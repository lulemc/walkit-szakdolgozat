import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import en from "./locales/en";
import hu from "./locales/hu";

export const LANGUAGES = ["en", "hu"] as const;
export type Language = (typeof LANGUAGES)[number];

export const resources = { en, hu };

const isLanguage = (code: string | null | undefined): code is Language =>
  LANGUAGES.includes(code as Language);

/** The first of the phone's languages that the app has, otherwise English */
export const deviceLanguage = (): Language => {
  try {
    return getLocales().map((locale) => locale.languageCode).find(isLanguage) ?? "en";
  } catch {
    return "en";
  }
};

const i18n = createInstance();
i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage(),
  fallbackLng: "en",
  ns: Object.keys(en),
  defaultNS: "common",
  // React already escapes what it renders
  interpolation: { escapeValue: false },
});

export default i18n;
