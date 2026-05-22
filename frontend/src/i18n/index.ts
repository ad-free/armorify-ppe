import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';

export type AppLocale = 'vi' | 'en';

const savedLang = localStorage.getItem('armorify-lang') as AppLocale | null;
const defaultLang: AppLocale = savedLang === 'en' || savedLang === 'vi' ? savedLang : 'vi';

const resources = {
  en: {
    translation: en,
  },
  vi: {
    translation: vi,
  },
};

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLang,
    // Vietnamese must not be used as fallback when the active language is English
    // (missing `en` keys were showing Vietnamese). English is the structural fallback.
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export const changeAppLanguage = (lang: AppLocale) => {
  localStorage.setItem('armorify-lang', lang);
  void i18n.changeLanguage(lang);
};

export default i18n;
