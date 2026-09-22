import { storage } from "@/services/storage";
import { getBusinessById, saveBusiness } from "@/services/auth";
import { uid } from "@/lib/id";
import { addDaysISO, addMonthsISO, todayISO } from "@/lib/format";
import { DEFAULT_TEMPLATES } from "@/lib/whatsapp";
import { desiredNotifications, currencySymbol } from "@/services/selectors";
import { EMPTY_SNAPSHOT, FREE_CUSTOMER_LIMIT } from "@/types";
import type {
  Activity,
  ActivityType,
  Business,
  CreditApplication,
  Customer,
  DataSnapshot,
  FollowUp,
  Invoice,
  MessageTemplate,
  Payment,
  StoredNotification,
} from "@/types";

/**
 * Business-scoped repository. Every function takes a businessId and only ever
 * touches that business's data — this is the isolation boundary. Swap the
 * storage calls for Firestore/Supabase calls to move to a real backend.
 */

function dataKey(businessId: string): string {
  return `data.${businessId}`;
}

export function loadSnapshot(businessId: string): DataSnapshot {
  return { ...EMPTY_SNAPSHOT, ...storage.read<DataSnapshot>(dataKey(businessId)) };
}

function saveSnapshot(businessId: string, snapshot: DataSnapshot): void {
  storage.write(dataKey(businessId), snapshot);
}

function mutate(businessId: string, fn: (snapshot: DataSnapshot) => DataSnapshot): DataSnapshot {
  const next = fn(loadSnapshot(businessId));
  saveSnapshot(businessId, next);
  return next;
}

function addActivity(
  snapshot: DataSnapshot,
  businessId: string,
  customerId: string,
  type: ActivityType,
  message: string,
  amount?: number,
): void {
  const activity: Activity = {
    id: uid("a_"),
    businessId,
    customerId,
    type,
    message,
    amount,
    createdAt: new Date().toISOString(),
  };
  snapshot.activities = [activity, ...snapshot.activities];
}

function nextInvoiceReference(snapshot: DataSnapshot): string {
  const numbers = snapshot.invoices
    .map((i) => Number(i.reference.replace(/\D/g, "")))
    .filter((n) => !Number.isNaN(n));
  const next = (numbers.length ? Math.max(...numbers) : 1000) + 1;
  return `INV-${next}`;
}

// ---------------------------------------------------------------------------
// Business
// ---------------------------------------------------------------------------

export function updateBusiness(business: Business): void {
  saveBusiness(business);
}

export function updateNotificationPrefs(
  businessId: string,
  prefs: Business["notifications"],
): void {
  const business = getBusinessById(businessId);
  if (business) saveBusiness({ ...business, notifications: prefs });
}

export function setPlan(businessId: string, plan: Business["plan"]): void {
  const business = getBusinessById(businessId);
  if (business) saveBusiness({ ...business, plan });
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export interface NewCustomerInput {
  name: string;
  phone: string;
  email?: string;
  type: Customer["type"];
  notes?: string;
  tags: Customer["tags"];
  firstInvoiceAmount?: number;
  firstInvoiceDueDate?: string;
}

export function addCustomer(businessId: string, input: NewCustomerInput): Customer {
  const business = getBusinessById(businessId);
  if (!business) throw new Error("We couldn't find your workspace. Please log in again.");
  const snapshot = loadSnapshot(businessId);
  const activeCount = snapshot.customers.filter((c) => !c.archived).length;
  if (business.plan === "free" && activeCount >= FREE_CUSTOMER_LIMIT) {
    throw new Error(
      `You've reached the Free plan limit of ${FREE_CUSTOMER_LIMIT} customers. Upgrade to Pro to add unlimited customers.`,
    );
  }

  const customer: Customer = {
    id: uid("c_"),
    businessId,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    type: input.type,
    notes: input.notes?.trim() || undefined,
    tags: input.tags,
    archived: false,
    createdAt: new Date().toISOString(),
  };

  return mutate(businessId, (s) => {
    s.customers = [customer, ...s.customers];
    addActivity(s, businessId, customer.id, "customer_added", "Customer added");
    if (input.firstInvoiceAmount && input.firstInvoiceAmount > 0) {
      const invoice: Invoice = {
        id: uid("i_"),
        businessId,
        customerId: customer.id,
        reference: nextInvoiceReference(s),
        amount: input.firstInvoiceAmount,
        dueDate: input.firstInvoiceDueDate || todayISO(),
        createdAt: new Date().toISOString(),
      };
      s.invoices = [invoice, ...s.invoices];
      addActivity(s, businessId, customer.id, "invoice", `Invoice ${invoice.reference} created`, invoice.amount);
    }
    return s;
  }).customers[0];
}

export function updateCustomer(businessId: string, customer: Customer): void {
  mutate(businessId, (s) => {
    s.customers = s.customers.map((c) => (c.id === customer.id ? customer : c));
    return s;
  });
}

export function setCustomerArchived(businessId: string, customerId: string, archived: boolean): void {
  mutate(businessId, (s) => {
    s.customers = s.customers.map((c) => (c.id === customerId ? { ...c, archived } : c));
    if (archived) {
      addActivity(s, businessId, customerId, "note", "Customer archived");
    }
    return s;
  });
}

// ---------------------------------------------------------------------------
// Invoices & payments
// ---------------------------------------------------------------------------

export function addInvoice(businessId: string, input: { customerId: string; amount: number; dueDate?: string; notes?: string }): Invoice {
  const invoice: Invoice = {
    id: uid("i_"),
    businessId,
    customerId: input.customerId,
    reference: "",
    amount: input.amount,
    dueDate: input.dueDate || todayISO(),
    notes: input.notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  return mutate(businessId, (s) => {
    invoice.reference = nextInvoiceReference(s);
    s.invoices = [invoice, ...s.invoices];
    addActivity(s, businessId, input.customerId, "invoice", `Invoice ${invoice.reference} created`, invoice.amount);
    return s;
  }).invoices[0];
}

export interface NewPaymentInput {
  customerId: string;
  invoiceId?: string;
  amount: number;
  date: string;
  method: Payment["method"];
  reference?: string;
  notes?: string;
  methodLabel?: string;
}

export function addPayment(businessId: string, input: NewPaymentInput): Payment {
  const payment: Payment = {
    id: uid("p_"),
    businessId,
    customerId: input.customerId,
    invoiceId: input.invoiceId,
    amount: input.amount,
    date: input.date,
    method: input.method,
    reference: input.reference?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  return mutate(businessId, (s) => {
    s.payments = [payment, ...s.payments];
    addActivity(
      s,
      businessId,
      input.customerId,
      "payment",
      input.invoiceId
        ? `Payment received via ${input.methodLabel ?? input.method} — applied to invoice`
        : `Payment received via ${input.methodLabel ?? input.method} — kept as customer credit`,
      input.amount,
    );
    return s;
  }).payments[0];
}

/**
 * Settle an invoice using the customer's available credit (advance). Creates
 * a credit application — a ledger row, never a new "payment" — so money in
 * stays recorded exactly once in the payments ledger.
 */
export function applyCredit(
  businessId: string,
  input: { customerId: string; invoiceId: string; amount: number },
): CreditApplication {
  const symbol = currencySymbol(getBusinessById(businessId)?.currency ?? "INR");
  const application: CreditApplication = {
    id: uid("ca_"),
    businessId,
    customerId: input.customerId,
    invoiceId: input.invoiceId,
    amount: input.amount,
    date: todayISO(),
    createdAt: new Date().toISOString(),
  };
  return mutate(businessId, (s) => {
    s.creditApplications = [application, ...(s.creditApplications ?? [])];
    const invoice = s.invoices.find((i) => i.id === input.invoiceId);
    addActivity(
      s,
      businessId,
      input.customerId,
      "payment",
      `Customer credit of ${symbol}${input.amount.toLocaleString("en-IN")} applied to ${invoice?.reference ?? "invoice"}`,
      input.amount,
    );
    return s;
  }).creditApplications[0];
}

// ---------------------------------------------------------------------------
// Follow-ups
// ---------------------------------------------------------------------------

export interface NewFollowUpInput {
  customerId: string;
  reason: FollowUp["reason"];
  date: string;
  time: string;
  priority: FollowUp["priority"];
  notes?: string;
  recurrence: FollowUp["recurrence"];
}

export function addFollowUp(businessId: string, input: NewFollowUpInput): FollowUp {
  const followUp: FollowUp = {
    id: uid("f_"),
    businessId,
    customerId: input.customerId,
    reason: input.reason,
    date: input.date,
    time: input.time,
    priority: input.priority,
    notes: input.notes?.trim() || undefined,
    status: "pending",
    recurrence: input.recurrence,
    createdAt: new Date().toISOString(),
  };
  return mutate(businessId, (s) => {
    s.followUps = [followUp, ...s.followUps];
    const customer = s.customers.find((c) => c.id === input.customerId);
    addActivity(s, businessId, input.customerId, "followup_scheduled", `Follow-up scheduled${customer ? ` for ${customer.name}` : ""}`);
    return s;
  }).followUps[0];
}

export function updateFollowUp(businessId: string, followUp: FollowUp): void {
  mutate(businessId, (s) => {
    s.followUps = s.followUps.map((f) => (f.id === followUp.id ? followUp : f));
    return s;
  });
}

export function rescheduleFollowUp(businessId: string, followUpId: string, date: string, time: string): void {
  mutate(businessId, (s) => {
    const existing = s.followUps.find((f) => f.id === followUpId);
    if (!existing) return s;
    s.followUps = s.followUps.map((f) => (f.id === followUpId ? { ...f, date, time } : f));
    addActivity(s, businessId, existing.customerId, "followup_rescheduled", "Follow-up rescheduled");
    return s;
  });
}

/** Completes a follow-up. Recurring follow-ups spawn their next occurrence. */
export function completeFollowUp(businessId: string, followUpId: string): void {
  mutate(businessId, (s) => {
    const existing = s.followUps.find((f) => f.id === followUpId);
    if (!existing || existing.status === "completed") return s;
    s.followUps = s.followUps.map((f) =>
      f.id === followUpId ? { ...f, status: "completed", completedAt: new Date().toISOString() } : f,
    );
    addActivity(s, businessId, existing.customerId, "followup_completed", "Follow-up completed");

    if (existing.recurrence !== "none") {
      const nextDate =
        existing.recurrence === "weekly"
          ? addDaysISO(existing.date, 7)
          : existing.recurrence === "monthly"
            ? addMonthsISO(existing.date, 1)
            : addMonthsISO(existing.date, 3);
      const next: FollowUp = {
        ...existing,
        id: uid("f_"),
        date: nextDate,
        status: "pending",
        completedAt: undefined,
        createdAt: new Date().toISOString(),
      };
      s.followUps = [next, ...s.followUps];
      addActivity(s, businessId, existing.customerId, "followup_scheduled", "Recurring follow-up scheduled");
    }
    return s;
  });
}

export function cancelFollowUp(businessId: string, followUpId: string): void {
  mutate(businessId, (s) => {
    s.followUps = s.followUps.map((f) => (f.id === followUpId ? { ...f, status: "cancelled" } : f));
    return s;
  });
}

export function deleteFollowUp(businessId: string, followUpId: string): void {
  mutate(businessId, (s) => {
    s.followUps = s.followUps.filter((f) => f.id !== followUpId);
    return s;
  });
}

// ---------------------------------------------------------------------------
// Activities & notes
// ---------------------------------------------------------------------------

export function logContactActivity(businessId: string, customerId: string, type: "whatsapp" | "call", templateName?: string): void {
  mutate(businessId, (s) => {
    addActivity(
      s,
      businessId,
      customerId,
      type,
      type === "whatsapp"
        ? `WhatsApp message sent${templateName ? ` — ${templateName}` : ""}`
        : "Call logged",
    );
    return s;
  });
}

export function addNote(businessId: string, customerId: string, note: string): void {
  mutate(businessId, (s) => {
    addActivity(s, businessId, customerId, "note", note.trim());
    return s;
  });
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export function ensureDefaultTemplates(businessId: string): void {
  const snapshot = loadSnapshot(businessId);
  if (snapshot.templates.length > 0) return;
  const now = new Date().toISOString();
  const templates: MessageTemplate[] = DEFAULT_TEMPLATES.map((t) => ({
    ...t,
    id: uid("t_"),
    businessId,
    createdAt: now,
  }));
  saveSnapshot(businessId, { ...snapshot, templates });
}

export function saveTemplate(businessId: string, template: Omit<MessageTemplate, "id" | "businessId" | "createdAt"> & { id?: string }): MessageTemplate {
  let saved: MessageTemplate | null = null;
  mutate(businessId, (s) => {
    if (template.id) {
      const existing = s.templates.find((t) => t.id === template.id);
      if (existing) {
        const updated: MessageTemplate = { ...existing, ...template, id: existing.id, businessId };
        s.templates = s.templates.map((t) => (t.id === updated.id ? updated : t));
        saved = updated;
        return s;
      }
    }
    const created: MessageTemplate = {
      ...template,
      id: uid("t_"),
      businessId,
      createdAt: new Date().toISOString(),
    };
    s.templates = [created, ...s.templates];
    saved = created;
    return s;
  });
  return (
    saved ?? {
      ...template,
      id: uid("t_"),
      businessId,
      createdAt: new Date().toISOString(),
    }
  );
}

export function deleteTemplate(businessId: string, templateId: string): void {
  mutate(businessId, (s) => {
    s.templates = s.templates.filter((t) => t.id !== templateId);
    return s;
  });
}

// ---------------------------------------------------------------------------
// Notifications — persistent, per-row read state
// ---------------------------------------------------------------------------

/**
 * Generate any missing notifications for today. Existing history is never
 * rewritten or deleted; new rows start unread. Settings gate which categories
 * are generated (see desiredNotifications).
 */
export function syncNotifications(businessId: string, business: Business): void {
  mutate(businessId, (s) => {
    const existing = new Set((s.notifications ?? []).map((n) => n.id));
    const missing: StoredNotification[] = desiredNotifications(s, business)
      .filter((c) => !existing.has(c.id))
      .map((c) => ({
        id: c.id,
        kind: c.kind,
        title: c.title,
        body: c.body,
        createdAt: new Date().toISOString(),
        read: false,
      }));
    if (missing.length > 0) s.notifications = [...missing, ...(s.notifications ?? [])];
    return s;
  });
}

export function markNotificationRead(businessId: string, notificationId: string): void {
  mutate(businessId, (s) => {
    s.notifications = (s.notifications ?? []).map((n) => (n.id === notificationId ? { ...n, read: true } : n));
    return s;
  });
}

export function markAllNotificationsRead(businessId: string): void {
  mutate(businessId, (s) => {
    s.notifications = (s.notifications ?? []).map((n) => (n.read ? n : { ...n, read: true }));
    return s;
  });
}

export function resetWorkspace(businessId: string): void {
  saveSnapshot(businessId, { ...EMPTY_SNAPSHOT });
}
