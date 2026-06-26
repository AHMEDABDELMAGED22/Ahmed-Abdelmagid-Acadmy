import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400",
        className
      )}
      {...props}
    />
  );
}
