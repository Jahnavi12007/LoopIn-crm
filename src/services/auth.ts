import { storage } from "@/services/storage";
import { seedDemoData } from "@/services/seed";
import type { Business, UserAccount } from "@/types";
import { uid } from "@/lib/id";

/**
 * Local account store. Accounts live on this device — designed so the same
 * interface maps 1:1 onto a backend auth provider (session + hashed passwords).
 */

interface PasswordReset {
  email: string;
  tokenHash: string;
  expiresAt: string;
}

interface Meta {
  users: UserAccount[];
  businesses: Business[];
  resets?: PasswordReset[];
}

interface Session {
  userId: string;
  businessId: string;
}

const META_KEY = "meta";
const SESSION_KEY = "session";

function getMeta(): Meta {
  return storage.read<Meta>(META_KEY) ?? { users: [], businesses: [] };
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`LoopIn::${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getSession(): Session | null {
  return storage.read<Session>(SESSION_KEY);
}

export function setSession(session: Session | null): void {
  if (session) storage.write(SESSION_KEY, session);
  else storage.remove(SESSION_KEY);
}

export function getUserById(id: string): UserAccount | null {
  return getMeta().users.find((u) => u.id === id) ?? null;
}

export function getBusinesses(): Business[] {
  return getMeta().businesses;
}

export function getBusinessById(id: string): Business | null {
  return getMeta().businesses.find((b) => b.id === id) ?? null;
}

export function saveBusiness(business: Business): void {
  const meta = getMeta();
  const idx = meta.businesses.findIndex((b) => b.id === business.id);
  if (idx >= 0) meta.businesses[idx] = business;
  else meta.businesses.push(business);
  storage.write(META_KEY, meta);
}

export async function signUp(input: { name: string; email: string; password: string }): Promise<{ user: UserAccount; business: Business }> {
  const meta = getMeta();
  const email = input.email.trim().toLowerCase();
  if (meta.users.some((u) => u.email === email)) {
    throw new Error("An account with this email already exists. Try logging in instead.");
  }
  const user: UserAccount = {
    id: uid("u_"),
    name: input.name.trim(),
    email,
    passwordHash: await hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };
  const business: Business = {
    id: uid("b_"),
    ownerId: user.id,
    name: "",
    ownerName: user.name,
    category: "other",
    phone: "",
    city: "",
    currency: "INR",
    email,
    howManage: null,
    goals: [],
    plan: "free",
    onboarded: false,
    notifications: { followUpReminders: true, paymentReminders: true, dailySummary: false },
    createdAt: new Date().toISOString(),
  };
  meta.users.push(user);
  meta.businesses.push(business);
  storage.write(META_KEY, meta);
  setSession({ userId: user.id, businessId: business.id });
  return { user, business };
}

export async function login(email: string, password: string): Promise<Session> {
  const meta = getMeta();
  const user = meta.users.find((u) => u.email === email.trim().toLowerCase());
  if (!user || user.passwordHash !== (await hashPassword(password))) {
    throw new Error("That email or password doesn't match. Please try again.");
  }
  const business = meta.businesses.find((b) => b.ownerId === user.id);
  if (!business) throw new Error("We couldn't find your workspace. Please contact support.");
  const session = { userId: user.id, businessId: business.id };
  setSession(session);
  return session;
}

/**
 * Password reset flow (local build). Because no email service is connected,
 * the caller receives a one-time token to hand to the user; only its hash is
 * stored and it expires after 30 minutes. Returns null when no account exists.
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  const meta = getMeta();
  const normalized = email.trim().toLowerCase();
  const user = meta.users.find((u) => u.email === normalized);
  if (!user) return null;
  const token = uid("rst_");
  const tokenHash = await hashPassword(token);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const resets = (meta.resets ?? []).filter((r) => r.email !== normalized && new Date(r.expiresAt) > new Date());
  resets.push({ email: normalized, tokenHash, expiresAt });
  meta.resets = resets;
  storage.write(META_KEY, meta);
  return token;
}

/** Consume a one-time reset token and set a new password. Never stores plaintext. */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const meta = getMeta();
  const resets = meta.resets ?? [];
  const tokenHash = await hashPassword(token.trim());
  const entry = resets.find((r) => r.tokenHash === tokenHash && new Date(r.expiresAt) > new Date());
  if (!entry) {
    throw new Error("This reset link is invalid or has expired. Please request a new one.");
  }
  if (newPassword.length < 8) {
    throw new Error("Choose a password with at least 8 characters.");
  }
  const user = meta.users.find((u) => u.email === entry.email);
  if (!user) {
    throw new Error("We couldn't find your account. Please request a new reset link.");
  }
  user.passwordHash = await hashPassword(newPassword);
  meta.resets = resets.filter((r) => r !== entry);
  storage.write(META_KEY, meta);
}

/** Loads the built-in demo workspace (seeded on first use, fresh dates). */
export function loginDemo(): Session {
  const { session } = seedDemoData();
  setSession(session);
  return session;
}

export function logout(): void {
  setSession(null);
}
