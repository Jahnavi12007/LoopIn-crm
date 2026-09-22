import type { CurrencyCode } from "@/types";

const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "en-AE",
};

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
};

/** Format a whole amount in the business currency, e.g. ₹4,500. */
export function formatAmount(amount: number, currency: CurrencyCode = "INR"): string {
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${CURRENCY_SYMBOLS[currency]}${amount.toLocaleString()}`;
  }
}

/** Compact form for tight spaces, e.g. ₹12.4k. */
export function formatAmountCompact(amount: number, currency: CurrencyCode = "INR"): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  if (Math.abs(amount) >= 100000) return `${symbol}${(amount / 100000).toFixed(1)}L`;
  if (Math.abs(amount) >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}k`;
  return `${symbol}${amount}`;
}

/** Today's date as YYYY-MM-DD in local time (not UTC). */
export function todayISO(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Pretty date: "Today", "Tomorrow", "Yesterday" or "Sep 18". */
export function formatDateLabel(dateISO: string): string {
  const today = todayISO();
  if (dateISO === today) return "Today";
  const tomorrow = addDaysISO(today, 1);
  if (dateISO === tomorrow) return "Tomorrow";
  const yesterday = addDaysISO(today, -1);
  if (dateISO === yesterday) return "Yesterday";
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en", { day: "numeric", month: "short" });
}

/** Long friendly date, e.g. "Sep 18, 2026". */
export function formatDateLong(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}

export function addDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function addMonthsISO(dateISO: string, months: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(y, m - 1 + months, d);
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

/** "10:00 AM" from "10:00". */
export function formatTimeLabel(time: string): string {
  const [h, min] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${`${min}`.padStart(2, "0")} ${suffix}`;
}

/** "Today · 10:00 AM" style label for a follow-up. */
export function formatDueLabel(dateISO: string, time: string): string {
  return `${formatDateLabel(dateISO)} · ${formatTimeLabel(time)}`;
}

export function formatRelativeTime(isoTimestamp: string): string {
  const then = new Date(isoTimestamp).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  const date = new Date(isoTimestamp);
  return date.toLocaleDateString("en", { day: "numeric", month: "short" });
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
}

/** Initials for avatars, e.g. "Ravi Kumar" → "RK". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
