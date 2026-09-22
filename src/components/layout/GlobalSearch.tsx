import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellRing, Plus, Search, User, Wallet } from "lucide-react";

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { useQuickActions } from "@/components/modals/QuickActions";
import { useSnapshot } from "@/hooks/useData";
import { formatAmount } from "@/lib/format";
import { bucketFollowUps } from "@/services/selectors";
import { FOLLOW_UP_REASON_LABELS } from "@/types";

/**
 * Global search: customers, follow-ups, payments and quick actions in one
 * fast, keyboard-friendly palette (⌘K / Ctrl+K).
 */
export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const snapshot = useSnapshot();
  const navigate = useNavigate();
  const quickActions = useQuickActions();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const buckets = useMemo(() => bucketFollowUps(snapshot), [snapshot]);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search customers, follow-ups, payments…" />
      <CommandList className="min-h-[260px]">
        <CommandEmpty>No results found. Try a name, phone number, or tag.</CommandEmpty>

        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => { onOpenChange(false); quickActions.openCustomerForm(); }}>
            <Plus className="mr-2 h-4 w-4 text-forest-600" aria-hidden="true" />
            Add Customer
          </CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); quickActions.openFollowUpForm(); }}>
            <BellRing className="mr-2 h-4 w-4 text-forest-600" aria-hidden="true" />
            Add Follow-up
          </CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); quickActions.openPaymentForm(); }}>
            <Wallet className="mr-2 h-4 w-4 text-forest-600" aria-hidden="true" />
            Record Payment
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Customers">
          {snapshot.customers
            .filter((c) => !c.archived)
            .slice(0, 50)
            .map((customer) => (
              <CommandItem
                key={customer.id}
                value={`${customer.name} ${customer.phone} ${customer.tags.join(" ")}`}
                onSelect={() => go(`/customers/${customer.id}`)}
              >
                <User className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span>{customer.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{customer.phone}</span>
              </CommandItem>
            ))}
        </CommandGroup>

        <CommandGroup heading="Follow-ups">
          {[...buckets.today, ...buckets.overdue, ...buckets.tomorrow, ...buckets.upcoming].slice(0, 20).map((f) => {
            const customer = snapshot.customers.find((c) => c.id === f.customerId);
            return (
              <CommandItem
                key={f.id}
                value={`follow-up ${customer?.name ?? ""} ${FOLLOW_UP_REASON_LABELS[f.reason]} ${f.notes ?? ""}`}
                onSelect={() => go("/followups")}
              >
                <BellRing className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span>
                  {customer?.name} · {FOLLOW_UP_REASON_LABELS[f.reason]}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">{f.date}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandGroup heading="Payments">
          {snapshot.invoices.slice(0, 20).map((invoice) => {
            const customer = snapshot.customers.find((c) => c.id === invoice.customerId);
            return (
              <CommandItem
                key={invoice.id}
                value={`invoice ${invoice.reference} ${customer?.name ?? ""}`}
                onSelect={() => (customer ? go(`/customers/${customer.id}`) : go("/payments"))}
              >
                <Wallet className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span>
                  {invoice.reference} · {customer?.name}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">{formatAmount(invoice.amount)}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Search"
      className="focus-ring flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted lg:h-9 lg:w-72 lg:justify-start lg:gap-2 lg:rounded-full lg:border lg:border-border lg:bg-card lg:px-3.5 lg:text-sm lg:text-muted-foreground"
    >
      <Search className="h-[18px] w-[18px] lg:h-4 lg:w-4" aria-hidden="true" />
      <span className="hidden lg:inline">Search…</span>
      <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline">
        ⌘K
      </kbd>
    </button>
  );
}

export { Search };
