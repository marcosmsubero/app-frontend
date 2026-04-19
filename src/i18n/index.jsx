/**
 * Lightweight i18n system — no external dependencies required.
 *
 * Usage:
 *   const { t, locale, setLocale } = useI18n();
 *   t("events.discover") → "Descubre Eventos" (es) / "Discover Events" (en)
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import es from "./es.js";
import en from "./en.js";

const translations = { es, en };
const SUPPORTED_LOCALES = ["es", "en"];
const STORAGE_KEY = "runvibe_locale";
// Legacy key kept for one-time migration from older app installs.
const LEGACY_STORAGE_KEY = "blablarun_locale";

function detectLocale() {
  // 1. Check saved preference (with one-time migration from legacy key)
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy && SUPPORTED_LOCALES.includes(legacy)) {
      try {
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {}
      return legacy;
    }
  } catch {}

  // 2. Check browser language
  const browserLang = (navigator.language || "es").split("-")[0].toLowerCase();
  if (SUPPORTED_LOCALES.includes(browserLang)) return browserLang;

  // 3. Default
  return "es";
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(detectLocale);

  const setLocale = useCallback((newLocale) => {
    if (!SUPPORTED_LOCALES.includes(newLocale)) return;
    setLocaleState(newLocale);
    try { localStorage.setItem(STORAGE_KEY, newLocale); } catch {}
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (key, fallback) => {
      const dict = translations[locale] || translations.es;
      return dict[key] ?? translations.es[key] ?? fallback ?? key;
    },
    [locale]
  );

  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
    supportedLocales: SUPPORTED_LOCALES,
  }), [locale, setLocale, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback for use outside provider
    return {
      locale: "es",
      setLocale: () => {},
      t: (key) => (translations.es[key] ?? key),
      supportedLocales: SUPPORTED_LOCALES,
    };
  }
  return ctx;
}
