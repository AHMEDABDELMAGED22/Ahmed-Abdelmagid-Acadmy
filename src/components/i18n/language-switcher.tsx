"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/70 p-1",
        compact && "scale-95"
      )}
      aria-label={t("common.language")}
    >
      <Languages className="mx-2 h-4 w-4 text-cyan-200" />
      {(["en", "ar"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
            locale === item ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:text-white"
          )}
        >
          {item === "en" ? "EN" : "AR"}
        </button>
      ))}
    </div>
  );
}
