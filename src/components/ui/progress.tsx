import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(100, value || 0));
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-slate-800", className)}>
      <div
        className="h-full rounded-full bg-cyan-400 transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
