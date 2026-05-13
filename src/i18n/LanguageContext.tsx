"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import en from "./locales/en.json";

export type Locale = "en" | "fr" | "de" | "ru" | "pt_BR" | "nl" | "id" | "pl";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "en",    label: "English",    flag: "🇬🇧" },
  { code: "fr",    label: "Français",   flag: "🇫🇷" },
  { code: "de",    label: "Deutsch",    flag: "🇩🇪" },
  { code: "ru",    label: "Русский",    flag: "🇷🇺" },
  { code: "pt_BR", label: "Português",  flag: "🇧🇷" },
  { code: "nl",    label: "Nederlands", flag: "🇳🇱" },
  { code: "id",    label: "Indonesia",  flag: "🇮🇩" },
  { code: "pl",    label: "Polski",     flag: "🇵🇱" },
];

type TranslationMap = Record<string, unknown>;

const localeImports: Record<Locale, () => Promise<{ default: TranslationMap }>> = {
  en:    () => import("./locales/en.json"),
  fr:    () => import("./locales/fr.json"),
  de:    () => import("./locales/de.json"),
  ru:    () => import("./locales/ru.json"),
  pt_BR: () => import("./locales/pt_BR.json"),
  nl:    () => import("./locales/nl.json"),
  id:    () => import("./locales/id.json"),
  pl:    () => import("./locales/pl.json"),
};

function resolve(obj: TranslationMap, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" && cur.length > 0 ? cur : undefined;
}

function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

interface LanguageCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageCtx>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [translations, setTranslations] = useState<TranslationMap>(en as TranslationMap);

  useEffect(() => {
    const stored = localStorage.getItem("pw_locale") as Locale | null;
    if (stored && localeImports[stored]) {
      setLocaleState(stored);
      localeImports[stored]().then((m) => setTranslations(m.default));
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem("pw_locale", l);
    setLocaleState(l);
    localeImports[l]().then((m) => setTranslations(m.default));
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const val = resolve(translations, key) ?? resolve(en as TranslationMap, key) ?? key;
      return interpolate(val, params);
    },
    [translations]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useT() {
  return useContext(LanguageContext).t;
}
