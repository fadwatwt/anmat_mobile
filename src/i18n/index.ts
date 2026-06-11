import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from '../locales/en/translation.json';
import ar from '../locales/ar/translation.json';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

const localeFromDevice = Localization.getLocales?.()?.[0]?.languageCode || 'en';
const detectedLanguage = ['en', 'ar'].includes(localeFromDevice) ? localeFromDevice : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: detectedLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
