import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from '../locales/en/translation.json';
import lgTranslation from '../locales/lg/translation.json';

const resources = {
  en: { translation: enTranslation },
  lg: { translation: lgTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
    react: {
      useSuspense: false, // we don't want suspense in React 18
    },
  });

export default i18n;