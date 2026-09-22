/**
 * Low-level local persistence. All app data is namespaced under one storage
 * prefix so it can be swapped for Firestore/Supabase later without touching
 * the UI — the db service is the only consumer of this module.
 */

const PREFIX = "nudge.v1.";

function readRaw<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (err) {
    console.error("storage read failed", key);
    return null;
  }
}

function writeRaw<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error("storage write failed", key);
    throw new Error("We couldn't save your changes. Your device storage may be full.");
  }
}

export const storage = { read: readRaw, write: writeRaw, remove: (key: string) => window.localStorage.removeItem(PREFIX + key) };
