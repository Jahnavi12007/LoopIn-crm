import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warn" | "positive";
  onClick?: () => void;
}

const TONE_STYLES = {
  default: "bg-forest-50 text-forest-700",
  warn: "bg-rose-50 text-rose-600",
  positive: "bg-gold-50 text-gold-700",
} as const;

export function StatCard({ icon: Icon, label, value, hint, tone = "default", onClick }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", TONE_STYLES[tone])}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-2 font-display text-[26px] font-semibold leading-8 tracking-tight text-foreground">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="card-lift w-full rounded-2xl border border-border bg-card p-4 text-left shadow-soft focus-ring"
      >
        {content}
      </button>
    );
  }

  return <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">{content}</div>;
}
