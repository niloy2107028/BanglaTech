import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from '../locales/translations';

const LanguageContext = createContext();
const STORAGE_KEY = 'banglamart-language';

function getNestedValue(object, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), object);
}

function interpolate(template, vars = {}) {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value),
    template
  );
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === 'bn' ? 'bn' : 'en';
  }, [language]);

  const t = (key, vars = {}, fallback = key) => {
    const localized = getNestedValue(translations[language], key) ?? getNestedValue(translations.en, key) ?? fallback;
    return typeof localized === 'string' ? interpolate(localized, vars) : localized;
  };

  const formatCurrency = (amount = 0) =>
    `৳${Number(amount || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}`;

  const formatNumber = (value = 0) =>
    Number(value || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US');

  const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB');
  };

  const translateCategoryName = (name = '') => {
    const normalized = String(name).trim().toLowerCase();
    return t(`categoryNames.${normalized}`, {}, name);
  };

  const translateOrderStatus = (status = '') => {
    const normalized = String(status).trim().toLowerCase();
    return t(`orders.${normalized}`, {}, status);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage((prev) => (prev === 'en' ? 'bn' : 'en')),
      t,
      formatCurrency,
      formatNumber,
      formatDate,
      translateCategoryName,
      translateOrderStatus,
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
