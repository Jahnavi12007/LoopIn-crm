import { addDaysISO, todayISO } from "@/lib/format";
import type {
  Business,
  Customer,
  CustomerStats,
  DataSnapshot,
  FollowUp,
  Invoice,
  InvoiceStatus,
  Payment,
} from "@/types";
import { PLAN_LABELS } from "@/types";

/**
 * Derived data (read models). ALL money math lives here — invoice balances,
 * customer credit, and statuses are always recalculated from the underlying
 * records (invoices, payments, credit applications), never stored on the
 * records themselves. That guarantees one source of truth: every screen,
 * modal, message, and chart derives identical numbers from the same functions.
 */

// ---------------------------------------------------------------------------
// Invoice breakdown — THE invoice-level calculation
// ---------------------------------------------------------------------------

export interface InvoiceBreakdown {
  invoice: Invoice;
  /** Payments explicitly assigned to this invoice (payments ledger). */
  assigned: number;
  /** Customer credit applied to this invoice (credit applications ledger). */
  creditApplied: number;
  /** Money settled on this invoice, capped at its amount. */
  paid: number;
  /** Amount still owed: max(amount - assigned - creditApplied, 0). */
  pending: number;
  status: InvoiceStatus;
}

function assignedPayments(snapshot: DataSnapshot, invoiceId: string): number {
  return snapshot.payments
    .filter((p) => p.invoiceId === invoiceId)
    .reduce((sum, p) => sum + p.amount, 0);
}

function appliedCredit(snapshot: DataSnapshot, invoiceId: string): number {
  return (snapshot.creditApplications ?? [])
    .filter((a) => a.invoiceId === invoiceId)
    .reduce((sum, a) => sum + a.amount, 0);
}

export function invoiceBreakdown(snapshot: DataSnapshot, invoice: Invoice): InvoiceBreakdown {
  const assigned = assignedPayments(snapshot, invoice.id);
  const creditApplied = appliedCredit(snapshot, invoice.id);
  const paid = Math.min(assigned + creditApplied, invoice.amount);
  const pending = Math.max(invoice.amount - assigned - creditApplied, 0);
  return { invoice, assigned, creditApplied, paid, pending, status: deriveStatus(invoice, paid, pending) };
}

/**
 * Status definitions (used everywhere):
 * - Paid: pending = 0
 * - Partially Paid: paid > 0 and pending > 0
 * - Overdue: still owed and the due date has passed
 * - Pending: paid = 0 and pending > 0 and not overdue
 */
function deriveStatus(invoice: Invoice, paid: number, pending: number): InvoiceStatus {
  if (invoice.amount > 0 && pending === 0) return "paid";
  if (invoice.dueDate && invoice.dueDate < todayISO()) return "overdue";
  if (paid > 0) return "partially-paid";
  return "pending";
}

// Back-compat helpers — all other code must go through these instead of
// computing balances inline.
export function invoicePaidAmount(snapshot: DataSnapshot, invoiceId: string): number {
  const invoice = snapshot.invoices.find((i) => i.id === invoiceId);
  if (!invoice) return 0;
  return invoiceBreakdown(snapshot, invoice).paid;
}

export function invoicePendingAmount(snapshot: DataSnapshot, invoice: Invoice): number {
  return invoiceBreakdown(snapshot, invoice).pending;
}

export function invoiceStatus(snapshot: DataSnapshot, invoice: Invoice): InvoiceStatus {
  return invoiceBreakdown(snapshot, invoice).status;
}

// ---------------------------------------------------------------------------
// Customer credit / advance — money received but not yet applied to invoices
// ---------------------------------------------------------------------------

/**
 * Customer credit = unallocated payments (no invoice) + overpayments on
 * assigned invoices (amounts beyond what the invoice needed) − credit already
 * applied to invoices via credit applications. Applications are not new money,
 * so they only consume the pool — never double-counted as payments.
 */
export function customerCredit(snapshot: DataSnapshot, customerId: string): number {
  const invoices = snapshot.invoices.filter((i) => i.customerId === customerId);
  const unallocated = snapshot.payments
    .filter((p) => p.customerId === customerId && !p.invoiceId)
    .reduce((sum, p) => sum + p.amount, 0);
  const overpaid = invoices.reduce((sum, i) => {
    const assigned = assignedPayments(snapshot, i.id);
    return sum + Math.max(assigned - i.amount, 0);
  }, 0);
  const applied = invoices.reduce((sum, i) => sum + appliedCredit(snapshot, i.id), 0);
  return Math.max(unallocated + overpaid - applied, 0);
}

// ---------------------------------------------------------------------------
// Customer stats — the single customer-level calculation
// ---------------------------------------------------------------------------

export function computeCustomerStats(snapshot: DataSnapshot, customerId: string): CustomerStats {
  const invoices = snapshot.invoices.filter((i) => i.customerId === customerId);
  const billed = invoices.reduce((sum, i) => sum + i.amount, 0);
  const paid = snapshot.payments
    .filter((p) => p.customerId === customerId)
    .reduce((sum, p) => sum + p.amount, 0);
  const credit = customerCredit(snapshot, customerId);
  const today = todayISO();

  const overdueAmount = invoices.reduce((sum, i) => {
    const { pending } = invoiceBreakdown(snapshot, i);
    if (i.dueDate && i.dueDate < today && pending > 0) return sum + pending;
    return sum;
  }, 0);

  const contactTypes = new Set(["whatsapp", "call", "note", "payment", "invoice"]);
  const lastContactedAt =
    snapshot.activities
      .filter((a) => a.customerId === customerId && contactTypes.has(a.type))
      .map((a) => a.createdAt)
      .sort()
      .at(-1) ?? null;

  const nextFollowUp =
    snapshot.followUps
      .filter((f) => f.customerId === customerId && f.status === "pending")
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0] ?? null;

  return {
    billed,
    paid,
    pending: invoices.reduce((sum, i) => sum + invoiceBreakdown(snapshot, i).pending, 0),
    credit,
    overdueAmount,
    lastContactedAt,
    nextFollowUp,
    openInvoices: invoices
      .map((i) => invoiceBreakdown(snapshot, i))
      .filter(({ pending }) => pending > 0)
      .sort((a, b) => (a.invoice.dueDate ?? "9999").localeCompare(b.invoice.dueDate ?? "9999"))
      .map(({ invoice }) => invoice),
  };
}

export function activeCustomers(snapshot: DataSnapshot): Customer[] {
  return snapshot.customers.filter((c) => !c.archived && c.type !== "lead");
}

export function leads(snapshot: DataSnapshot): Customer[] {
  return snapshot.customers.filter((c) => !c.archived && c.type === "lead");
}

export function totalPendingAmount(snapshot: DataSnapshot): number {
  return snapshot.customers.reduce((sum, c) => {
    if (c.archived) return sum;
    return sum + computeCustomerStats(snapshot, c.id).pending;
  }, 0);
}

export function collectedThisMonth(snapshot: DataSnapshot): number {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}`;
  return snapshot.payments
    .filter((p) => p.date.startsWith(prefix))
    .reduce((sum, p) => sum + p.amount, 0);
}

// ---------------------------------------------------------------------------
// Follow-ups
// ---------------------------------------------------------------------------

export interface FollowUpBuckets {
  overdue: FollowUp[];
  today: FollowUp[];
  tomorrow: FollowUp[];
  upcoming: FollowUp[];
  completed: FollowUp[];
}

export function bucketFollowUps(snapshot: DataSnapshot): FollowUpBuckets {
  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);
  const pending = snapshot.followUps
    .filter((f) => f.status === "pending")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return {
    overdue: pending.filter((f) => f.date < today),
    today: pending.filter((f) => f.date === today),
    tomorrow: pending.filter((f) => f.date === tomorrow),
    upcoming: pending.filter((f) => f.date > tomorrow),
    completed: snapshot.followUps
      .filter((f) => f.status === "completed")
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")),
  };
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardMetrics {
  todayFollowUps: FollowUp[];
  overdueFollowUps: FollowUp[];
  pendingPayments: number;
  pendingPaymentCustomers: Customer[];
  activeCustomers: number;
  newLeads: number;
}

export function dashboardMetrics(snapshot: DataSnapshot): DashboardMetrics {
  const buckets = bucketFollowUps(snapshot);
  const pendingPaymentCustomers = snapshot.customers
    .filter((c) => !c.archived)
    .map((c) => ({ customer: c, stats: computeCustomerStats(snapshot, c.id) }))
    .filter(({ stats }) => stats.pending > 0)
    .sort((a, b) => b.stats.pending - a.stats.pending);

  return {
    todayFollowUps: buckets.today,
    overdueFollowUps: buckets.overdue,
    pendingPayments: totalPendingAmount(snapshot),
    pendingPaymentCustomers: pendingPaymentCustomers.map(({ customer }) => customer),
    activeCustomers: activeCustomers(snapshot).length,
    newLeads: leads(snapshot).length,
  };
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface AnalyticsData {
  months: Array<{
    label: string;
    newCustomers: number;
    followUpsCompleted: number;
    collected: number;
  }>;
  followUpsCompletedTotal: number;
  followUpsOverdueCount: number;
  collectedThisMonth: number;
  outstanding: number;
  repeatCustomers: number;
  totalCustomers: number;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function analytics(snapshot: DataSnapshot): AnalyticsData {
  const now = new Date();
  const months: AnalyticsData["months"] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const prefix = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`;
    months.push({
      label: MONTH_LABELS[d.getMonth()],
      newCustomers: snapshot.customers.filter((c) => c.createdAt.startsWith(prefix)).length,
      followUpsCompleted: snapshot.followUps.filter(
        (f) => f.status === "completed" && (f.completedAt ?? "").startsWith(prefix),
      ).length,
      collected: snapshot.payments.filter((p) => p.date.startsWith(prefix)).reduce((s, p) => s + p.amount, 0),
    });
  }

  const repeatIds = new Set(snapshot.payments.map((p) => p.customerId));
  return {
    months,
    followUpsCompletedTotal: snapshot.followUps.filter((f) => f.status === "completed").length,
    followUpsOverdueCount: bucketFollowUps(snapshot).overdue.length,
    collectedThisMonth: collectedThisMonth(snapshot),
    outstanding: totalPendingAmount(snapshot),
    repeatCustomers: snapshot.customers.filter((c) => !c.archived && repeatIds.has(c.id)).length,
    totalCustomers: activeCustomers(snapshot).length,
  };
}

// ---------------------------------------------------------------------------
// Notifications — desired state derivation
// ---------------------------------------------------------------------------

export interface NotificationCandidate {
  /** Deterministic per-day id — the db layer uses it to avoid duplicates. */
  id: string;
  kind: "followups-today" | "followups-overdue" | "payments-overdue" | "daily-summary";
  title: string;
  body: string;
}

export function currencySymbol(currency: Business["currency"]): string {
  return currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "AED ";
}

/**
 * What notifications SHOULD exist today. Generation only ever ADDS new rows
 * (keyed per day) — existing history is never deleted or rewritten. Categories
 * disabled in settings simply don't produce candidates, so turning a setting
 * off stops NEW notifications while keeping history intact.
 */
export function desiredNotifications(snapshot: DataSnapshot, business: Business): NotificationCandidate[] {
  const buckets = bucketFollowUps(snapshot);
  const today = todayISO();
  const prefs = business.notifications;
  const candidates: NotificationCandidate[] = [];

  if (prefs.followUpReminders) {
    if (buckets.today.length > 0) {
      candidates.push({
        id: `followups-today:${today}`,
        kind: "followups-today",
        title: `${buckets.today.length} ${buckets.today.length === 1 ? "follow-up is" : "follow-ups are"} due today`,
        body: "Open the dashboard to see who to contact.",
      });
    }
    if (buckets.overdue.length > 0) {
      candidates.push({
        id: `followups-overdue:${today}`,
        kind: "followups-overdue",
        title: `${buckets.overdue.length} overdue ${buckets.overdue.length === 1 ? "follow-up" : "follow-ups"}`,
        body: "These slipped past their due date. Reschedule or complete them.",
      });
    }
  }

  if (prefs.paymentReminders) {
    const overdueTotal = snapshot.customers
      .filter((c) => !c.archived)
      .reduce((sum, c) => sum + computeCustomerStats(snapshot, c.id).overdueAmount, 0);
    if (overdueTotal > 0) {
      candidates.push({
        id: `payments-overdue:${today}`,
        kind: "payments-overdue",
        title: `${currencySymbol(business.currency)}${overdueTotal.toLocaleString("en-IN")} in payments are overdue`,
        body: "Send a gentle payment reminder on WhatsApp.",
      });
    }
  }

  if (prefs.dailySummary) {
    const pending = totalPendingAmount(snapshot);
    candidates.push({
      id: `daily-summary:${today}`,
      kind: "daily-summary",
      title: `Today: ${buckets.today.length} follow-up${buckets.today.length === 1 ? "" : "s"} · ${currencySymbol(business.currency)}${pending.toLocaleString("en-IN")} pending`,
      body: "Your morning snapshot of who to contact and what to collect.",
    });
  }

  return candidates;
}

/** Human label for the active plan (kept here so UI stays consistent). */
export function planLabel(plan: Business["plan"]): string {
  return PLAN_LABELS[plan];
}
