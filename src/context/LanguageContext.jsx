import { createContext, useContext, useState } from 'react';
import { translations } from '../data/translations.js';

const LanguageContext = createContext(null);

export const LANGUAGES = {
  en: { code: 'en', label: 'English', nativeLabel: 'English' },
  hi: { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    localStorage.getItem('shilpsetu_lang') || 'en'
  );

  const changeLanguage = (lang) => {
    if (LANGUAGES[lang]) {
      setLanguage(lang);
      localStorage.setItem('shilpsetu_lang', lang);
    }
  };

  const isHindi = language === 'hi';

  const t = (key) => {
    return translations[language]?.[key] || translations.en?.[key] || key;
  };

  const value = {
    language,
    changeLanguage,
    setLanguage: changeLanguage,
    isHindi,
    t,
    languages: Object.values(LANGUAGES),
    currentLanguage: LANGUAGES[language],
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
