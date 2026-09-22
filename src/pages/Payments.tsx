import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Wallet, WalletCards } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { InvoiceStatusBadge } from "@/components/common/Badges";
import { Button } from "@/components/ui/button";
import { useQuickActions } from "@/components/modals/QuickActions";
import { useAuth } from "@/context/AuthContext";
import { useSnapshot } from "@/hooks/useData";
import { collectedThisMonth, invoiceBreakdown, totalPendingAmount } from "@/services/selectors";
import { formatAmount, formatDateLong } from "@/lib/format";

export default function Payments() {
  const { business } = useAuth();
  const snapshot = useSnapshot();
  const quickActions = useQuickActions();
  const currency = business?.currency ?? "INR";

  const outstanding = useMemo(() => totalPendingAmount(snapshot), [snapshot]);
  const collected = useMemo(() => collectedThisMonth(snapshot), [snapshot]);

  const rows = useMemo(
    () =>
      snapshot.invoices
        .map((invoice) => {
          const customer = snapshot.customers.find((c) => c.id === invoice.customerId);
          const breakdown = invoiceBreakdown(snapshot, invoice);
          return { invoice, customer, paid: breakdown.paid, pending: breakdown.pending, status: breakdown.status };
        })
        .sort((a, b) => {
          const order = { overdue: 0, pending: 1, "partially-paid": 2, paid: 3 } as const;
          return order[a.status] - order[b.status] || (a.invoice.dueDate ?? "").localeCompare(b.invoice.dueDate ?? "");
        }),
    [snapshot],
  );

  const overdueCount = rows.filter((r) => r.status === "overdue").length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Payments"
        description="Every rupee billed, collected, and pending — at a glance."
        actions={
          <Button onClick={() => quickActions.openPaymentForm()}>
            <Wallet className="mr-2 h-4 w-4" aria-hidden="true" />
            Record Payment
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Total Outstanding"
          value={formatAmount(outstanding, currency)}
          hint={outstanding > 0 ? "Across all customers" : "Everything settled"}
          tone={outstanding > 0 ? "warn" : "default"}
        />
        <StatCard icon={CheckCircle2} label="Collected This Month" value={formatAmount(collected, currency)} hint="Money in the bank" tone="positive" />
        <StatCard
          icon={WalletCards}
          label="Pending Invoices"
          value={String(rows.filter((r) => r.status === "pending" || r.status === "partially-paid").length)}
          hint="Awaiting payment"
        />
        <StatCard
          icon={AlertCircle}
          label="Overdue"
          value={String(overdueCount)}
          hint={overdueCount > 0 ? "Send gentle reminders" : "None overdue"}
          tone={overdueCount > 0 ? "warn" : "default"}
        />
      </div>

      <section className="mt-8" aria-labelledby="payment-table">
        <h2 id="payment-table" className="mb-3 font-display text-lg font-semibold">
          All Payments
        </h2>

        {rows.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No pending payments."
            description="When you add customers with a total amount, their charges show up here for tracking."
            action={
              <Button variant="outline" onClick={() => quickActions.openCustomerForm()}>
                Add Customer
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-soft md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-cream-50/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-5 py-3">Customer</th>
                    <th scope="col" className="px-5 py-3">Reference</th>
                    <th scope="col" className="px-5 py-3 text-right">Total</th>
                    <th scope="col" className="px-5 py-3 text-right">Paid</th>
                    <th scope="col" className="px-5 py-3 text-right">Pending</th>
                    <th scope="col" className="px-5 py-3">Due date</th>
                    <th scope="col" className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ invoice, customer, paid, pending, status }) => (
                    <tr key={invoice.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-cream-50/50">
                      <td className="px-5 py-3.5">
                        {customer ? (
                          <Link to={`/customers/${customer.id}`} className="font-semibold hover:text-forest-700 focus-ring rounded">
                            {customer.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{invoice.reference}</td>
                      <td className="px-5 py-3.5 text-right font-semibold">{formatAmount(invoice.amount, currency)}</td>
                      <td className="px-5 py-3.5 text-right text-forest-700">{paid > 0 ? formatAmount(paid, currency) : "—"}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-rose-600">
                        {pending > 0 ? formatAmount(pending, currency) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{invoice.dueDate ? formatDateLong(invoice.dueDate) : "—"}</td>
                      <td className="px-5 py-3.5">
                        <InvoiceStatusBadge status={status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2.5 md:hidden">
              {rows.map(({ invoice, customer, paid, pending, status }) => (
                <div key={invoice.id} className="rounded-2xl border border-border bg-card px-4 py-3.5 shadow-soft">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{customer?.name ?? "—"}</p>
                    <InvoiceStatusBadge status={status} />
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold">{formatAmount(invoice.amount, currency)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Paid</p>
                      <p className="font-semibold text-forest-700">{paid > 0 ? formatAmount(paid, currency) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pending</p>
                      <p className="font-semibold text-rose-600">
                        {pending > 0 ? formatAmount(pending, currency) : "—"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {invoice.reference} · due {invoice.dueDate ? formatDateLong(invoice.dueDate) : "—"}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
