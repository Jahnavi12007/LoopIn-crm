import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

const PALETTE = [
  "bg-forest-100 text-forest-800",
  "bg-gold-100 text-gold-800",
  "bg-cream-200 text-forest-800",
  "bg-forest-800 text-forest-50",
  "bg-rose-50 text-rose-800",
  "bg-sky-50 text-sky-800",
];

export function AvatarInitials({ name, className }: { name: string; className?: string }) {
  const idx = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % PALETTE.length;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full text-sm font-bold",
        PALETTE[idx],
        className,
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}
