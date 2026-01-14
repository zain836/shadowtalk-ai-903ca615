import { useState, useEffect, useCallback } from 'react';
import { Language, getTranslation, getCurrentLanguage, setLanguage as setLang } from '@/lib/i18n';

export const useTranslation = () => {
  const [language, setLanguageState] = useState<Language>(getCurrentLanguage);

  useEffect(() => {
    // Set initial direction for RTL languages
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((key: string): string => {
    return getTranslation(language, key);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLang(lang);
    setLanguageState(lang);
  }, []);

  return { t, language, setLanguage };
};
