import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en/common.json";
import th from "./th/common.json";

i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  resources: {
    en: { common: en },
    th: { common: th },
  },
  lng: "th",
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default i18n;
