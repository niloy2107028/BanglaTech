import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { interpolate, translations } from "../i18n/translations";

type Language = "en" | "bn";

interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : path;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const raw = getNestedValue(
        translations[language] as unknown as Record<string, unknown>,
        key,
      );
      return interpolate(raw, params);
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      toggleLanguage: () => setLanguage((prev: Language) => (prev === "en" ? "bn" : "en")),
      t,
    }),
    [language, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
