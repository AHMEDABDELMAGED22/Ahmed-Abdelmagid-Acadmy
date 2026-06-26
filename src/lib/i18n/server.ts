import { cookies } from "next/headers";
import { dictionaries, getByPath, getDirection, interpolate, type Locale } from "@/lib/i18n/dictionaries";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("AHMED_ACADEMY_LOCALE")?.value;
  return value === "ar" ? "ar" : "en";
}

export async function getI18n() {
  const locale = await getLocale();
  const dictionary = dictionaries[locale];
  return {
    locale,
    direction: getDirection(locale),
    dictionary,
    t(key: string, values?: Record<string, string | number>) {
      return interpolate(getByPath(dictionary, key), values);
    },
  };
}
