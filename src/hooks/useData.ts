import { useCallback, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import * as db from "@/services/db";
import { PLAN_CUSTOMER_LIMITS } from "@/types";
import type { Business, DataSnapshot } from "@/types";

/**
 * React Query bindings over the local data layer. All mutations invalidate the
 * per-business snapshot so every screen reflects changes immediately.
 */

export function snapshotKey(businessId: string) {
  return ["snapshot", businessId] as const;
}

export function useSnapshot(): DataSnapshot {
  const { business } = useAuth();
  const query = useQuery({
    queryKey: snapshotKey(business?.id ?? "none"),
    queryFn: () => db.loadSnapshot(business?.id ?? ""),
    enabled: Boolean(business),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return query.data ?? EMPTY_FALLBACK;
}

const EMPTY_FALLBACK: DataSnapshot = {
  customers: [],
  invoices: [],
  payments: [],
  creditApplications: [],
  followUps: [],
  activities: [],
  templates: [],
  notifications: [],
};

/** Run a db mutation, then refresh the snapshot. Returns the mutation's result. */
export function useDbAction<TResult, TArgs extends unknown[]>(
  action: (businessId: string, ...args: TArgs) => TResult,
  options: { successMessage?: string | ((...args: TArgs) => string); onDone?: (...args: TArgs) => void } = {},
) {
  const { business } = useAuth();
  const queryClient = useQueryClient();

  return useCallback(
    async (...args: TArgs) => {
      if (!business) return undefined;
      try {
        const result = await action(business.id, ...args);
        await queryClient.invalidateQueries({ queryKey: snapshotKey(business.id) });
        if (options.successMessage) {
          const message =
            typeof options.successMessage === "function" ? options.successMessage(...args) : options.successMessage;
          if (message) toast.success(message);
        }
        options.onDone?.(...args);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        toast.error(message);
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [business, action, options.successMessage, options.onDone, queryClient],
  );
}

// ---------------------------------------------------------------------------
// Notifications — persistent, with per-row read state
// ---------------------------------------------------------------------------

export function useNotifications() {
  const { business } = useAuth();
  const snapshot = useSnapshot();
  const queryClient = useQueryClient();

  const notifications = useMemo(
    () => [...(snapshot.notifications ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [snapshot.notifications],
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Generate any missing notifications for today (idempotent; settings-gated).
  // Kept in a query mutation so the cache refreshes after writes.
  const sync = useMutation({
    mutationFn: (b: Business) => {
      db.syncNotifications(b.id, b);
      return Promise.resolve();
    },
    onSuccess: async () => {
      if (business) await queryClient.invalidateQueries({ queryKey: snapshotKey(business.id) });
    },
  });

  useEffect(() => {
    if (business) sync.mutate(business);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id, business?.notifications.followUpReminders, business?.notifications.paymentReminders, business?.notifications.dailySummary, snapshot.customers.length, snapshot.followUps.length, snapshot.invoices.length, snapshot.payments.length]);

  const markRead = useCallback(
    async (notificationId: string) => {
      if (!business) return;
      db.markNotificationRead(business.id, notificationId);
      await queryClient.invalidateQueries({ queryKey: snapshotKey(business.id) });
    },
    [business, queryClient],
  );

  const markAllRead = useCallback(async () => {
    if (!business) return;
    db.markAllNotificationsRead(business.id);
    await queryClient.invalidateQueries({ queryKey: snapshotKey(business.id) });
  }, [business, queryClient]);

  return { notifications, unreadCount, markRead, markAllRead };
}

// ---------------------------------------------------------------------------
// Plan helpers
// ---------------------------------------------------------------------------

export function usePlan(): {
  plan: Business["plan"];
  planLabel: string;
  isFree: boolean;
  customerCount: number;
  /** Max customers allowed on the active plan, or null when unlimited. */
  customerLimit: number | null;
} {
  const { business } = useAuth();
  const snapshot = useSnapshot();
  const plan = business?.plan ?? "free";
  const customerCount = snapshot.customers?.filter((c) => !c.archived).length ?? 0;
  return {
    plan,
    planLabel: plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Business",
    isFree: plan === "free",
    customerCount,
    customerLimit: PLAN_CUSTOMER_LIMITS[plan],
  };
}

export type { DataSnapshot };
