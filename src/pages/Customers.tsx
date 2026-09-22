import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Archive,
  ArrowLeft,
  BellRing,
  ChevronRight,
  ClipboardList,
  MessageSquarePlus,
  Pencil,
  Phone,
  Receipt,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { AvatarInitials } from "@/components/common/AvatarInitials";
import { InvoiceStatusBadge, TagPill } from "@/components/common/Badges";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { FollowUpCard, RescheduleDialog } from "@/components/common/FollowUpCard";
import { useQuickActions } from "@/components/modals/QuickActions";
import { useAuth } from "@/context/AuthContext";
import { useDbAction, useSnapshot } from "@/hooks/useData";
import { computeCustomerStats, invoiceBreakdown } from "@/services/selectors";
import { formatAmount, formatDateLong, formatRelativeTime, todayISO } from "@/lib/format";
import { buildCallLink } from "@/lib/whatsapp";
import * as db from "@/services/db";
import { FOLLOW_UP_REASON_LABELS } from "@/types";
import type { Activity } from "@/types";

const ACTIVITY_ICONS: Record<Activity["type"], LucideIcon> = {
  customer_added: MessageSquarePlus,
  note: ClipboardList,
  whatsapp: BellRing,
  call: Phone,
  followup_scheduled: BellRing,
  followup_completed: BellRing,
  followup_rescheduled: BellRing,
  payment: Wallet,
  invoice: Receipt,
};

export default function CustomerProfile() {
  const { customerId } = useParams<{ customerId: string }>();
  const { business } = useAuth();
  const snapshot = useSnapshot();
  const navigate = useNavigate();
  const quickActions = useQuickActions();
  const currency = business?.currency ?? "INR";

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [note, setNote] = useState("");

  const customer = snapshot.customers.find((c) => c.id === customerId);
  const stats = useMemo(() => (customer ? computeCustomerStats(snapshot, customer.id) : null), [snapshot, customer]);

  const activities = useMemo(
    () => snapshot.activities.filter((a) => a.customerId === customerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [snapshot.activities, customerId],
  );

  const followUps = useMemo(
    () =>
      snapshot.followUps
        .filter((f) => f.customerId === customerId)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [snapshot.followUps, customerId],
  );

  const logCall = useDbAction(
    (businessId: string, id: string) => db.logContactActivity(businessId, id, "call"),
    { successMessage: null },
  );
  const archiveCustomer = useDbAction(
    (businessId: string, id: string, archived: boolean) => db.setCustomerArchived(businessId, id, archived),
    { successMessage: (id: string, archived: boolean) => (archived ? "Customer archived" : "Customer restored") },
  );
  const addNote = useDbAction(
    (businessId: string, id: string, text: string) => db.addNote(businessId, id, text),
    { successMessage: "Note added" },
  );
  const addInvoice = useDbAction(db.addInvoice, { successMessage: "Charge added" });
  const applyCreditAction = useDbAction(
    (businessId: string, input: { customerId: string; invoiceId: string; amount: number }) =>
      db.applyCredit(businessId, input),
    { successMessage: "Customer credit applied" },
  );

  if (!customer || !stats) {
    return (
      <div className="animate-fade-up">
        <EmptyState
          icon={Pencil}
          title="Customer not found."
          description="This customer may have been removed."
          action={
            <Button variant="outline" onClick={() => navigate("/customers")}>
              Back to Customers
            </Button>
          }
        />
      </div>
    );
  }

  const nextPending = followUps.find((f) => f.status === "pending");
  const pastFollowUps = followUps.filter((f) => f.status !== "pending");

  return (
    <div className="animate-fade-up">
      <Link
        to="/customers"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground focus-ring rounded"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Customers
      </Link>

      {/* Header */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <AvatarInitials name={customer.name} className="h-14 w-14 text-lg" />
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-semibold tracking-tight">{customer.name}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{customer.phone}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {customer.type === "lead" ? <TagPill tag="new" /> : null}
                {customer.tags.map((tag) => (
                  <TagPill key={tag} tag={tag} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" aria-label="Edit customer" onClick={() => quickActions.openCustomerForm(customer)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={customer.archived ? "Restore customer" : "Archive customer"}
              onClick={() => setArchiveOpen(true)}
            >
              <Archive className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Primary actions */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button
            className="bg-forest-600 hover:bg-forest-700"
            onClick={() => quickActions.openMessageComposer({ customer, followUp: nextPending ?? null, invoice: stats.openInvoices[0] ?? null })}
          >
            <WhatsAppIcon className="mr-1.5 h-4 w-4" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.open(buildCallLink(customer.phone), "_self");
              void logCall(customer.id);
            }}
          >
            <Phone className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Call
          </Button>
          <Button variant="outline" onClick={() => quickActions.openFollowUpForm({ customerId: customer.id })}>
            <BellRing className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Follow-up
          </Button>
          <Button variant="outline" onClick={() => quickActions.openPaymentForm({ customerId: customer.id })}>
            <Wallet className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Payment
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {/* Overview */}
          <section aria-labelledby="overview-heading" className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 id="overview-heading" className="font-display text-base font-semibold">
              Customer Overview
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Total billed", value: formatAmount(stats.billed, currency) },
                { label: "Total paid", value: formatAmount(stats.paid, currency), tone: "text-forest-700" },
                { label: "Pending", value: formatAmount(stats.pending, currency), tone: stats.pending > 0 ? "text-rose-600" : "text-forest-600" },
                { label: "Customer credit", value: formatAmount(stats.credit, currency), tone: stats.credit > 0 ? "text-gold-700" : undefined },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  <p className={`mt-1 font-display text-lg font-semibold ${item.tone ?? ""}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Last contacted {stats.lastContactedAt ? formatRelativeTime(stats.lastContactedAt) : "—"}
              {stats.credit > 0 ? " · credit/advance is applied from the invoice list below" : ""}
            </p>
            {customer.notes ? (
              <p className="mt-4 rounded-xl bg-cream-50 px-3.5 py-3 text-sm text-foreground/90">{customer.notes}</p>
            ) : null}
          </section>

          {/* Invoices */}
          <section aria-labelledby="invoices-heading" className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 id="invoices-heading" className="font-display text-base font-semibold">
                Payments
              </h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => {
                    const amount = window.prompt("Charge amount?");
                    const parsed = amount ? Number(amount.replace(/[^\d.]/g, "")) : 0;
                    if (parsed > 0) void addInvoice({ customerId: customer.id, amount: parsed, dueDate: todayISO() });
                  }}
                >
                  Add charge
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => quickActions.openPaymentForm({ customerId: customer.id })}>
                  Record payment
                </Button>
              </div>
            </div>
            {snapshot.invoices.filter((i) => i.customerId === customer.id).length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No charges yet. Add one to start tracking what this customer owes.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border/70">
                {snapshot.invoices
                  .filter((i) => i.customerId === customer.id)
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((invoice) => {
                    const breakdown = invoiceBreakdown(snapshot, invoice);
                    return (
                      <li key={invoice.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">
                            {invoice.reference}
                            {breakdown.paid > 0 && breakdown.pending > 0 ? (
                              <span className="ml-2 text-xs font-medium text-muted-foreground">
                                {formatAmount(breakdown.paid, currency)} paid · {formatAmount(breakdown.pending, currency)} pending
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due {invoice.dueDate ? formatDateLong(invoice.dueDate) : "—"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {stats.credit > 0 && breakdown.pending > 0 ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 border-gold-300 px-2 text-[11px] text-gold-800 hover:bg-gold-50"
                              onClick={() =>
                                void applyCreditAction({
                                  customerId: customer.id,
                                  invoiceId: invoice.id,
                                  amount: Math.min(stats.credit, breakdown.pending),
                                })
                              }
                            >
                              Apply credit
                            </Button>
                          ) : null}
                          <span className="text-sm font-semibold">{formatAmount(invoice.amount, currency)}</span>
                          <InvoiceStatusBadge status={breakdown.status} />
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </section>

          {/* Follow-ups */}
          <section aria-labelledby="fu-heading" className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 id="fu-heading" className="font-display text-base font-semibold">
                Follow-ups
              </h2>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => quickActions.openFollowUpForm({ customerId: customer.id })}>
                Add
              </Button>
            </div>
            {followUps.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No follow-ups yet for this customer.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {nextPending ? (
                  <FollowUpCard
                    followUp={nextPending}
                    customer={customer}
                    currency={currency}
                    pendingAmount={nextPending.reason === "payment" ? stats.pending : 0}
                    showEditActions
                  />
                ) : null}
                {pastFollowUps.length > 0 ? (
                  <ul className="divide-y divide-border/70">
                    {pastFollowUps.slice(0, 5).map((f) => (
                      <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                        <span className="text-sm">
                          <span className="font-medium">{FOLLOW_UP_REASON_LABELS[f.reason]}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{formatDateLong(f.date)}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          {f.status === "completed" ? (
                            <span className="rounded-full bg-forest-50 px-2 py-0.5 text-[11px] font-semibold text-forest-700">Completed</span>
                          ) : (
                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">Cancelled</span>
                          )}
                          {f.status === "completed" ? null : (
                            <RescheduleButton followUpId={f.id} date={f.date} time={f.time} />
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </section>
        </div>

        {/* Activity timeline */}
        <section aria-labelledby="timeline-heading" className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 id="timeline-heading" className="font-display text-base font-semibold">
              Activity Timeline
            </h2>

            <form
              className="mt-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (note.trim().length < 2) return;
                void addNote(customer.id, note);
                setNote("");
              }}
            >
              <Textarea
                rows={2}
                placeholder="Add a note — what did you discuss?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                aria-label="Add a note"
              />
              <Button type="submit" size="sm" variant="outline" className="mt-2" disabled={note.trim().length < 2}>
                Save Note
              </Button>
            </form>

            {activities.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ol className="mt-5 space-y-0">
                {activities.map((activity, idx) => {
                  const Icon = ACTIVITY_ICONS[activity.type] ?? ClipboardList;
                  const showDateHeader =
                    idx === 0 ||
                    new Date(activities[idx - 1].createdAt).toDateString() !== new Date(activity.createdAt).toDateString();
                  return (
                    <li key={activity.id}>
                      {showDateHeader ? (
                        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:mt-0">
                          {formatDateLong(activity.createdAt.slice(0, 10))}
                        </p>
                      ) : null}
                      <div className="relative flex gap-3 pb-5">
                        {idx < activities.length - 1 ? (
                          <span className="absolute left-[15px] top-8 h-full w-px bg-border" aria-hidden="true" />
                        ) : null}
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 pt-1">
                          <p className="text-sm text-foreground">{activity.message}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{formatRelativeTime(activity.createdAt)}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={customer.archived ? "Restore customer?" : "Archive customer?"}
        description={
          customer.archived
            ? "This customer will reappear in your customer list."
            : "They'll be hidden from your lists. Their history is kept and you can restore them anytime."
        }
        confirmLabel={customer.archived ? "Restore" : "Archive"}
        onConfirm={async () => {
          await archiveCustomer(customer.id, !customer.archived);
          if (!customer.archived) navigate("/customers");
        }}
      />

      {/* Edit modal handled via quick actions (preloaded) */}
    </div>
  );
}

function RescheduleButton({ followUpId, date, time }: { followUpId: string; date: string; time: string }) {
  const [open, setOpen] = useState(false);
  const reschedule = useDbAction(
    (businessId: string, id: string, d: string, t: string) => db.rescheduleFollowUp(businessId, id, d, t),
    { successMessage: "Follow-up rescheduled" },
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-forest-700 hover:underline focus-ring rounded"
      >
        Reschedule
        <ChevronRight className="inline h-3 w-3" aria-hidden="true" />
      </button>
      <RescheduleDialog
        open={open}
        onOpenChange={setOpen}
        defaultDate={date}
        defaultTime={time}
        onSave={async (d, t) => {
          await reschedule(followUpId, d, t);
        }}
      />
    </>
  );
}
