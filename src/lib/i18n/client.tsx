"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  dictionaries,
  getByPath,
  getDirection,
  interpolate,
  type Dictionary,
  type Direction,
  type Locale,
} from "@/lib/i18n/dictionaries";

interface I18nContextValue {
  locale: Locale;
  direction: Direction;
  dictionary: Dictionary;
  t: (key: string, values?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = dictionaries[locale];
    return {
      locale,
      direction: getDirection(locale),
      dictionary,
      t(key, values) {
        return interpolate(getByPath(dictionary, key), values);
      },
      setLocale(nextLocale) {
        document.cookie = `AHMED_ACADEMY_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
        setLocaleState(nextLocale);
        router.refresh();
      },
    };
  }, [locale, router]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = value.direction;
  }, [locale, value.direction]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
