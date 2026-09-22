/** Core domain types for LoopIn. Single source of truth for the data layer. */

export type BusinessCategory =
  | "salon"
  | "tailor"
  | "repair"
  | "tutor"
  | "photographer"
  | "retail"
  | "home-services"
  | "other";

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AED";

export type Plan = "free" | "pro" | "business";

export type CustomerSource = "whatsapp" | "notebook" | "sheets" | "crm" | "other";

export type OnboardingGoal =
  | "follow-ups"
  | "payments"
  | "organization"
  | "repeat-customers"
  | "all";

export interface NotificationPreferences {
  followUpReminders: boolean;
  paymentReminders: boolean;
  dailySummary: boolean;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  ownerName: string;
  category: BusinessCategory;
  phone: string;
  city: string;
  currency: CurrencyCode;
  email: string;
  howManage: CustomerSource | null;
  goals: OnboardingGoal[];
  plan: Plan;
  onboarded: boolean;
  notifications: NotificationPreferences;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export type CustomerTag = "new" | "vip" | "regular" | "follow-up" | "payment-due" | "completed";

export type CustomerType = "lead" | "customer" | "repeat";

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  type: CustomerType;
  notes?: string;
  tags: CustomerTag[];
  archived: boolean;
  createdAt: string;
}

/** A charge billed to a customer. "Paid" is derived from the payments ledger. */
export interface Invoice {
  id: string;
  businessId: string;
  customerId: string;
  reference: string;
  amount: number;
  dueDate?: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export type PaymentMethod = "cash" | "upi" | "bank" | "card" | "other";

export interface Payment {
  id: string;
  businessId: string;
  customerId: string;
  /** When set, the payment is applied to this invoice. Unset = unallocated customer credit. */
  invoiceId?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  createdAt: string;
}

/**
 * Using existing customer credit to settle an invoice. Applications are not
 * new money — they consume the customer's credit pool (which comes from
 * payments). This keeps the payments ledger as the only record of money in.
 */
export interface CreditApplication {
  id: string;
  businessId: string;
  customerId: string;
  invoiceId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export type FollowUpReason =
  | "payment"
  | "order"
  | "appointment"
  | "enquiry"
  | "feedback"
  | "other";

export type FollowUpPriority = "low" | "medium" | "high";

export type FollowUpStatus = "pending" | "completed" | "cancelled";

export type FollowUpRecurrence = "none" | "weekly" | "monthly" | "quarterly";

export interface FollowUp {
  id: string;
  businessId: string;
  customerId: string;
  reason: FollowUpReason;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  priority: FollowUpPriority;
  notes?: string;
  status: FollowUpStatus;
  recurrence: FollowUpRecurrence;
  completedAt?: string;
  createdAt: string;
}

export type ActivityType =
  | "customer_added"
  | "note"
  | "whatsapp"
  | "call"
  | "followup_scheduled"
  | "followup_completed"
  | "followup_rescheduled"
  | "payment"
  | "invoice";

export interface Activity {
  id: string;
  businessId: string;
  customerId: string;
  type: ActivityType;
  message: string;
  amount?: number;
  createdAt: string;
}

export type TemplateCategory = "payment" | "follow-up" | "appointment" | "thank-you" | "custom";

export interface MessageTemplate {
  id: string;
  businessId: string;
  name: string;
  category: TemplateCategory;
  body: string;
  isDefault: boolean;
  createdAt: string;
}

/**
 * Per-business persisted data. Always accessed through the db service, filtered by businessId.
 */
export interface DataSnapshot {
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  creditApplications: CreditApplication[];
  followUps: FollowUp[];
  activities: Activity[];
  templates: MessageTemplate[];
  /** Notification history. Generated rows are never deleted; read state is per row. */
  notifications: StoredNotification[];
}

export interface CustomerStats {
  /** Σ invoice amounts for this customer. */
  billed: number;
  /** Money actually received from this customer (payments ledger). */
  paid: number;
  /** Amount still owed on invoices (after assigned payments + applied credit). */
  pending: number;
  /** Money received but not yet applied to any invoice (credit / advance). */
  credit: number;
  overdueAmount: number;
  lastContactedAt: string | null;
  nextFollowUp: FollowUp | null;
  openInvoices: Invoice[];
}

/** In-app notification stored in the snapshot. New rows start unread. */
export interface StoredNotification {
  id: string;
  kind: "followups-today" | "followups-overdue" | "payments-overdue" | "daily-summary";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

/** Derived status of an invoice — see selectors.invoiceStatus. */
export type InvoiceStatus = "paid" | "partially-paid" | "pending" | "overdue";

export const FOLLOW_UP_REASON_LABELS: Record<FollowUpReason, string> = {
  payment: "Payment",
  order: "Order",
  appointment: "Appointment",
  enquiry: "Enquiry",
  feedback: "Feedback",
  other: "Other",
};

export const CUSTOMER_TAG_LABELS: Record<CustomerTag, string> = {
  new: "New",
  vip: "VIP",
  regular: "Regular",
  "follow-up": "Follow-up",
  "payment-due": "Payment Due",
  completed: "Completed",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  bank: "Bank transfer",
  card: "Card",
  other: "Other",
};

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  salon: "Salon & Beauty",
  tailor: "Tailor & Boutique",
  repair: "Repair & Service",
  tutor: "Tutor & Tuition",
  photographer: "Photography & Events",
  retail: "Retail Shop",
  "home-services": "Home Services",
  other: "Other",
};

/** Free plan cap. Pro/Business are unlimited (null). */
export const FREE_CUSTOMER_LIMIT = 50;

export const PLAN_CUSTOMER_LIMITS: Record<Plan, number | null> = {
  free: FREE_CUSTOMER_LIMIT,
  pro: null,
  business: null,
};

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
};

export const EMPTY_SNAPSHOT: DataSnapshot = {
  customers: [],
  invoices: [],
  payments: [],
  creditApplications: [],
  followUps: [],
  activities: [],
  templates: [],
  notifications: [],
};
