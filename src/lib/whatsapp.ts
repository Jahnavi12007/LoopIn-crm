import type { Customer, FollowUp, Invoice, MessageTemplate } from "@/types";
import { formatDateLong, formatTimeLabel } from "@/lib/format";

/**
 * WhatsApp deep-link helpers. These open wa.me with a pre-filled message —
 * no WhatsApp Business API is used. The data layer keeps per-customer message
 * activity so an official API integration can be swapped in later.
 */

/** Normalize a phone number for wa.me: 10-digit numbers are assumed to be India (+91). */
export function normalizeWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${normalizeWhatsAppNumber(phone)}?text=${encodeURIComponent(message)}`;
}

export function buildCallLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Replace {{placeholders}} in a template body. Unknown placeholders are dropped. */
export function renderTemplate(
  body: string,
  vars: { customer?: Customer; businessName: string; amount?: number; amountLabel?: string; date?: string; time?: string; reference?: string },
): string {
  const customerName = vars.customer?.name?.split(" ")[0] ?? vars.customer?.name ?? "";
  const fullName = vars.customer?.name ?? "";
  return body
    .replaceAll("{{name}}", customerName)
    .replaceAll("{{full_name}}", fullName)
    .replaceAll("{{business}}", vars.businessName)
    .replaceAll("{{amount}}", vars.amountLabel ?? (vars.amount != null ? String(vars.amount) : ""))
    .replaceAll("{{date}}", vars.date ?? "")
    .replaceAll("{{time}}", vars.time ?? "")
    .replaceAll("{{reference}}", vars.reference ?? "")
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Variables that templates may reference — shown in the template editor. */
export const TEMPLATE_PLACEHOLDERS = [
  { token: "{{name}}", description: "Customer first name" },
  { token: "{{business}}", description: "Your business name" },
  { token: "{{amount}}", description: "Pending amount" },
  { token: "{{date}}", description: "Appointment or due date" },
  { token: "{{time}}", description: "Appointment time" },
  { token: "{{reference}}", description: "Invoice / order reference" },
] as const;

/**
 * Build variables for a template in the context of a customer + optional
 * follow-up/invoice. {{amount}} must always be the CURRENT PENDING amount —
 * callers resolve it via the shared finance selectors, never the original
 * invoice amount.
 */
export function templateVars(
  customer: Customer | undefined,
  businessName: string,
  opts: { followUp?: FollowUp | null; invoice?: Invoice | null; amount?: number } = {},
) {
  return {
    customer,
    businessName,
    amount: opts.amount,
    date: opts.followUp ? formatDateLong(opts.followUp.date) : undefined,
    time: opts.followUp ? formatTimeLabel(opts.followUp.time) : undefined,
    reference: opts.invoice?.reference,
  };
}

export const DEFAULT_TEMPLATES: Array<Omit<MessageTemplate, "id" | "businessId" | "createdAt">> = [
  {
    name: "Payment Reminder",
    category: "payment",
    body: "Hi {{name}}, just a quick reminder regarding your pending payment of {{amount}}. Please let us know when convenient. Thank you.\n\n— {{business}}",
    isDefault: true,
  },
  {
    name: "Follow-up",
    category: "follow-up",
    body: "Hi {{name}}, just checking in regarding your recent enquiry. Please let us know if you need any help.\n\n— {{business}}",
    isDefault: true,
  },
  {
    name: "Appointment Reminder",
    category: "appointment",
    body: "Hi {{name}}, this is a reminder about your appointment on {{date}} at {{time}}. See you soon!\n\n— {{business}}",
    isDefault: true,
  },
  {
    name: "Thank You",
    category: "thank-you",
    body: "Thank you for choosing {{business}}. We really appreciate your business!",
    isDefault: true,
  },
];
