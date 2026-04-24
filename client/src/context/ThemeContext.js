import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext();
const STORAGE_KEY = "banglamart-theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";

  const stored = String(window.localStorage.getItem(STORAGE_KEY) || "").trim().toLowerCase();
  if (stored === "light" || stored === "dark") return stored;

  const prefersDark = Boolean(window.matchMedia?.("(prefers-color-scheme: dark)")?.matches);
  return prefersDark ? "dark" : "light";
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const safeTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", safeTheme);
    document.documentElement.style.colorScheme = safeTheme;
    window.localStorage.setItem(STORAGE_KEY, safeTheme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDarkMode: theme === "dark",
      setTheme,
      toggleTheme: () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
