import { storage } from "@/services/storage";
import { getBusinesses, hashPassword, saveBusiness } from "@/services/auth";
import { DEFAULT_TEMPLATES } from "@/lib/whatsapp";
import { addDaysISO, addMonthsISO, todayISO } from "@/lib/format";
import { uid } from "@/lib/id";
import { EMPTY_SNAPSHOT } from "@/types";
import type { Business, Customer, CustomerTag, DataSnapshot } from "@/types";

/**
 * Demo workspace. Clearly flagged with isDemo and kept in its own data
 * namespace — real signups never see this data.
 */

export const DEMO_BUSINESS_ID = "b_demo";
const DEMO_USER_ID = "u_demo";
const DEMO_EMAIL = "demo@nudge.app";
const DATA_KEY = `data.${DEMO_BUSINESS_ID}`;

function iso(daysFromNow: number): string {
  return addDaysISO(todayISO(), daysFromNow);
}

function ts(daysAgo: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function demoBusiness(): Business {
  return {
    id: DEMO_BUSINESS_ID,
    ownerId: DEMO_USER_ID,
    name: "Glow Studio",
    ownerName: "Anita",
    category: "salon",
    phone: "919845012345",
    city: "Bengaluru",
    currency: "INR",
    email: DEMO_EMAIL,
    howManage: "whatsapp",
    goals: ["follow-ups", "payments"],
    plan: "free",
    onboarded: true,
    notifications: { followUpReminders: true, paymentReminders: true, dailySummary: false },
    createdAt: ts(90),
  };
}

function demoSnapshot(): DataSnapshot {
  const now = new Date().toISOString();
  const b = DEMO_BUSINESS_ID;

  const customers: Customer[] = [
    { id: "c_ravi", name: "Ravi Kumar", phone: "919812345601", email: "", type: "repeat" as const, tags: ["regular", "payment-due"], notes: "Prefers weekend slots. Bridal package in progress.", createdAt: ts(85) },
    { id: "c_priya", name: "Priya Sharma", phone: "919812345602", email: "priya.s@example.com", type: "repeat" as const, tags: ["vip"], notes: "Booked for sister's mehendi next month.", createdAt: ts(60) },
    { id: "c_anil", name: "Anil Reddy", phone: "919812345603", email: "", type: "customer" as const, tags: ["new"], notes: "Came via Instagram enquiry.", createdAt: ts(12) },
    { id: "c_sneha", name: "Sneha Patel", phone: "919812345604", email: "", type: "repeat" as const, tags: ["regular"], notes: "Monthly keratin treatment.", createdAt: ts(150) },
    { id: "c_rahul", name: "Rahul Verma", phone: "919812345605", email: "", type: "lead" as const, tags: ["new", "follow-up"], notes: "Asked about party makeup pricing — waiting on quote.", createdAt: ts(4) },
    { id: "c_meera", name: "Meera Iyer", phone: "919812345606", email: "", type: "repeat" as const, tags: ["vip", "payment-due"], notes: "Refers many friends — always send festival offers.", createdAt: ts(200) },
    { id: "c_farhan", name: "Farhan Sheikh", phone: "919812345607", email: "", type: "customer" as const, tags: ["regular"], notes: "", createdAt: ts(45) },
    { id: "c_kavya", name: "Kavya Nair", phone: "919812345608", email: "", type: "customer" as const, tags: ["completed"], notes: "Bridal package completed in August.", createdAt: ts(70) },
  ].map((c) => ({ ...c, tags: c.tags as CustomerTag[], businessId: b, archived: false, email: c.email || undefined }));

  const invoices = [
    { id: "i_1", businessId: b, customerId: "c_ravi", reference: "INV-1041", amount: 8000, dueDate: iso(-9), notes: "Bridal package — 2nd installment", createdAt: ts(20) },
    { id: "i_2", businessId: b, customerId: "c_meera", reference: "INV-1044", amount: 6500, dueDate: iso(-16), notes: "Hair spa + colour, September visit", createdAt: ts(24) },
    { id: "i_3", businessId: b, customerId: "c_anil", reference: "INV-1047", amount: 3500, dueDate: iso(6), notes: "Haircut + beard styling package", createdAt: ts(10) },
    { id: "i_4", businessId: b, customerId: "c_sneha", reference: "INV-1048", amount: 4200, dueDate: iso(12), notes: "Keratin treatment monthly", createdAt: ts(5) },
    { id: "i_5", businessId: b, customerId: "c_kavya", reference: "INV-0990", amount: 28000, dueDate: iso(-70), notes: "Full bridal package", createdAt: ts(80) },
  ];

  const payments = [
    { id: "p_1", businessId: b, customerId: "c_ravi", invoiceId: "i_1", amount: 3500, date: iso(-20), method: "upi" as const, reference: "UPI/8821", createdAt: ts(20) },
    { id: "p_2", businessId: b, customerId: "c_anil", invoiceId: "i_3", amount: 1000, date: iso(-8), method: "cash" as const, createdAt: ts(8) },
    { id: "p_3", businessId: b, customerId: "c_kavya", invoiceId: "i_5", amount: 28000, date: iso(-72), method: "bank" as const, reference: "NEFT/5540", createdAt: ts(72) },
    { id: "p_4", businessId: b, customerId: "c_sneha", invoiceId: "i_4", amount: 4200, date: iso(-3), method: "upi" as const, createdAt: ts(3) },
    { id: "p_5", businessId: b, customerId: "c_priya", amount: 2500, date: iso(-6), method: "upi" as const, notes: "Advance for mehendi booking", createdAt: ts(6) },
  ];

  const followUps = [
    { id: "f_1", businessId: b, customerId: "c_ravi", reason: "payment" as const, date: todayISO(), time: "10:00", priority: "high" as const, notes: "₹4,500 balance on bridal package. Gentle reminder.", status: "pending" as const, recurrence: "none" as const, createdAt: ts(2) },
    { id: "f_2", businessId: b, customerId: "c_rahul", reason: "enquiry" as const, date: todayISO(), time: "12:30", priority: "medium" as const, notes: "Send party makeup price list.", status: "pending" as const, recurrence: "none" as const, createdAt: ts(1) },
    { id: "f_3", businessId: b, customerId: "c_meera", reason: "payment" as const, date: todayISO(), time: "17:00", priority: "high" as const, notes: "₹6,500 pending since last visit.", status: "pending" as const, recurrence: "none" as const, createdAt: ts(3) },
    { id: "f_4", businessId: b, customerId: "c_priya", reason: "appointment" as const, date: iso(1), time: "11:00", priority: "medium" as const, notes: "Confirm mehendi trial date.", status: "pending" as const, recurrence: "none" as const, createdAt: ts(1) },
    { id: "f_5", businessId: b, customerId: "c_anil", reason: "feedback" as const, date: iso(3), time: "16:00", priority: "low" as const, notes: "First visit feedback + ask for a review.", status: "pending" as const, recurrence: "none" as const, createdAt: ts(2) },
    { id: "f_6", businessId: b, customerId: "c_sneha", reason: "appointment" as const, date: iso(-2), time: "10:00", priority: "medium" as const, notes: "Monthly keratin slot.", status: "pending" as const, recurrence: "monthly" as const, createdAt: ts(30) },
    { id: "f_7", businessId: b, customerId: "c_farhan", reason: "order" as const, date: iso(-5), time: "14:00", priority: "high" as const, notes: "Product he ordered is back in stock.", status: "pending" as const, recurrence: "none" as const, createdAt: ts(9) },
    { id: "f_8", businessId: b, customerId: "c_priya", reason: "feedback" as const, date: iso(-8), time: "15:00", priority: "low" as const, notes: "", status: "completed" as const, recurrence: "none" as const, completedAt: ts(8, 15, 10), createdAt: ts(12) },
    { id: "f_9", businessId: b, customerId: "c_kavya", reason: "feedback" as const, date: iso(-30), time: "12:00", priority: "low" as const, notes: "Post-bridal check-in.", status: "completed" as const, recurrence: "none" as const, completedAt: ts(30, 12, 5), createdAt: ts(35) },
  ];

  const activities = [
    { id: "a_1", businessId: b, customerId: "c_ravi", type: "payment" as const, message: "Payment of ₹3,500 received via UPI", amount: 3500, createdAt: ts(20, 11) },
    { id: "a_2", businessId: b, customerId: "c_ravi", type: "whatsapp" as const, message: "WhatsApp message sent — appointment confirmation", createdAt: ts(15, 18) },
    { id: "a_3", businessId: b, customerId: "c_ravi", type: "followup_scheduled" as const, message: "Follow-up scheduled: payment reminder", createdAt: ts(2, 9) },
    { id: "a_4", businessId: b, customerId: "c_priya", type: "payment" as const, message: "Advance payment of ₹2,500 received via UPI", amount: 2500, createdAt: ts(6, 13) },
    { id: "a_5", businessId: b, customerId: "c_priya", type: "whatsapp" as const, message: "WhatsApp message sent — mehendi enquiry follow-up", createdAt: ts(7, 10) },
    { id: "a_6", businessId: b, customerId: "c_anil", type: "customer_added" as const, message: "Customer added", createdAt: ts(12, 9) },
    { id: "a_7", businessId: b, customerId: "c_anil", type: "invoice" as const, message: "Invoice INV-1047 created — ₹3,500", amount: 3500, createdAt: ts(10, 12) },
    { id: "a_8", businessId: b, customerId: "c_anil", type: "payment" as const, message: "Advance of ₹1,000 received (cash)", amount: 1000, createdAt: ts(8, 17) },
    { id: "a_9", businessId: b, customerId: "c_sneha", type: "payment" as const, message: "Payment of ₹4,200 received via UPI", amount: 4200, createdAt: ts(3, 10) },
    { id: "a_10", businessId: b, customerId: "c_sneha", type: "call" as const, message: "Called — confirmed next appointment window", createdAt: ts(4, 11, 30) },
    { id: "a_11", businessId: b, customerId: "c_rahul", type: "note" as const, message: "Asked about party makeup pricing — shared broad range, needs a formal quote", createdAt: ts(4, 15) },
    { id: "a_12", businessId: b, customerId: "c_meera", type: "whatsapp" as const, message: "WhatsApp message sent — festival offer", createdAt: ts(18, 12) },
    { id: "a_13", businessId: b, customerId: "c_kavya", type: "payment" as const, message: "Final payment of ₹28,000 received (bank transfer)", amount: 28000, createdAt: ts(72, 12) },
    { id: "a_14", businessId: b, customerId: "c_farhan", type: "note" as const, message: "Waiting for restock of styling serum", createdAt: ts(9, 16) },
    { id: "a_15", businessId: b, customerId: "c_priya", type: "followup_completed" as const, message: "Follow-up completed: feedback call", createdAt: ts(8, 15, 10) },
  ];

  const templates = DEFAULT_TEMPLATES.map((t) => ({ ...t, id: uid("t_"), businessId: b, createdAt: now }));

  return {
    customers,
    invoices,
    payments,
    creditApplications: [],
    followUps,
    activities,
    templates,
    notifications: [],
  };
}

/** Idempotently create the demo workspace with a fresh demo password. */
export function seedDemoData(): { business: Business; session: { userId: string; businessId: string } } {
  const business = demoBusiness();
  if (!getBusinesses().some((x) => x.id === DEMO_BUSINESS_ID)) {
    saveBusiness(business);
    // Register the demo user so the meta store stays consistent.
    const metaRaw = storage.read<{ users: { id: string; name: string; email: string; passwordHash: string; createdAt: string }[]; businesses: Business[] }>("meta");
    if (metaRaw && !metaRaw.users.some((u) => u.id === DEMO_USER_ID)) {
      void hashPassword("demo1234").then((hash) => {
        const meta = storage.read<{ users: { id: string; name: string; email: string; passwordHash: string; createdAt: string }[]; businesses: Business[] }>("meta");
        if (meta && !meta.users.some((u) => u.id === DEMO_USER_ID)) {
          meta.users.push({ id: DEMO_USER_ID, name: "Anita", email: DEMO_EMAIL, passwordHash: hash, createdAt: business.createdAt });
          storage.write("meta", meta);
        }
      });
    }
  } else {
    // Refresh stored demo data dates so the dashboard always looks current.
    storage.write(DATA_KEY, demoSnapshot());
    saveBusiness(business);
    return { business, session: { userId: DEMO_USER_ID, businessId: DEMO_BUSINESS_ID } };
  }
  storage.write(DATA_KEY, demoSnapshot());
  return { business, session: { userId: DEMO_USER_ID, businessId: DEMO_BUSINESS_ID } };
}

export function isDemoBusinessId(id: string): boolean {
  return id === DEMO_BUSINESS_ID;
}

export { EMPTY_SNAPSHOT };
