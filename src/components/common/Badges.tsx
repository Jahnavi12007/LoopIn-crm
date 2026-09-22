import { cn } from "@/lib/utils";
import { CUSTOMER_TAG_LABELS } from "@/types";
import type { CustomerTag, FollowUpPriority, InvoiceStatus } from "@/types";

const TAG_STYLES: Record<CustomerTag, string> = {
  new: "bg-forest-50 text-forest-700 border-forest-200",
  vip: "bg-gold-50 text-gold-800 border-gold-200",
  regular: "bg-cream-100 text-forest-800 border-cream-200",
  "follow-up": "bg-sky-50 text-sky-800 border-sky-200",
  "payment-due": "bg-rose-50 text-rose-800 border-rose-200",
  completed: "bg-stone-100 text-stone-700 border-stone-200",
};

export function TagPill({ tag, className }: { tag: CustomerTag; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-4",
        TAG_STYLES[tag],
        className,
      )}
    >
      {CUSTOMER_TAG_LABELS[tag]}
    </span>
  );
}

const PRIORITY_STYLES: Record<FollowUpPriority, { dot: string; label: string }> = {
  high: { dot: "bg-rose-500", label: "High" },
  medium: { dot: "bg-gold-400", label: "Medium" },
  low: { dot: "bg-forest-400", label: "Low" },
};

export function PriorityBadge({ priority, className }: { priority: FollowUpPriority; className?: string }) {
  const style = PRIORITY_STYLES[priority];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} aria-hidden="true" />
      {style.label}
    </span>
  );
}

const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  paid: "bg-forest-50 text-forest-700",
  "partially-paid": "bg-gold-50 text-gold-800",
  pending: "bg-stone-100 text-stone-700",
  overdue: "bg-rose-50 text-rose-700",
};

const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  paid: "Paid",
  "partially-paid": "Partially Paid",
  pending: "Pending",
  overdue: "Overdue",
};

export function InvoiceStatusBadge({ status, className }: { status: InvoiceStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        INVOICE_STATUS_STYLES[status],
        className,
      )}
    >
      {INVOICE_STATUS_LABELS[status]}
    </span>
  );
}
