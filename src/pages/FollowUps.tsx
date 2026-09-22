import { useMemo } from "react";
import { BellRing, Check } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { FollowUpCard } from "@/components/common/FollowUpCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuickActions } from "@/components/modals/QuickActions";
import { useAuth } from "@/context/AuthContext";
import { useDbAction, useSnapshot } from "@/hooks/useData";
import { bucketFollowUps, computeCustomerStats } from "@/services/selectors";
import * as db from "@/services/db";
import type { CurrencyCode, FollowUp } from "@/types";

export default function FollowUps() {
  const { business } = useAuth();
  const snapshot = useSnapshot();
  const quickActions = useQuickActions();
  const buckets = useMemo(() => bucketFollowUps(snapshot), [snapshot]);
  const currency = business?.currency ?? "INR";

  const totalDueToday = buckets.today.length + buckets.overdue.length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Follow-ups"
        description={
          totalDueToday > 0
            ? `${totalDueToday} ${totalDueToday === 1 ? "follow-up needs" : "follow-ups need"} your attention today.`
            : "Nothing urgent. Keep the streak going."
        }
        actions={
          <Button onClick={() => quickActions.openFollowUpForm()}>
            <BellRing className="mr-2 h-4 w-4" aria-hidden="true" />
            Add Follow-up
          </Button>
        }
      />

      <Tabs defaultValue="today">
        <TabsList className="mb-4 h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="overdue" className="gap-1.5">
            Overdue
            {buckets.overdue.length > 0 ? (
              <span className="rounded-full bg-rose-100 px-1.5 text-[11px] font-bold text-rose-700">{buckets.overdue.length}</span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="today" className="gap-1.5">
            Today
            {buckets.today.length > 0 ? (
              <span className="rounded-full bg-gold-200 px-1.5 text-[11px] font-bold text-gold-900">{buckets.today.length}</span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="overdue">
          {buckets.overdue.length === 0 ? (
            <EmptyState icon={Check} title="No overdue follow-ups." description="Nothing has slipped past its date. Nice work!" />
          ) : (
            <FollowUpGrid followUps={buckets.overdue} currency={currency} showEditActions />
          )}
        </TabsContent>

        <TabsContent value="today">
          {buckets.today.length === 0 ? (
            <EmptyState
              icon={BellRing}
              title="You're all caught up 🎉"
              description="No follow-ups due today. Add one so no customer slips through."
              action={
                <Button onClick={() => quickActions.openFollowUpForm()}>Add Follow-up</Button>
              }
            />
          ) : (
            <FollowUpGrid followUps={buckets.today} currency={currency} showEditActions />
          )}
        </TabsContent>

        <TabsContent value="tomorrow">
          {buckets.tomorrow.length === 0 ? (
            <EmptyState icon={BellRing} title="Nothing scheduled for tomorrow." description="Plan ahead — schedule follow-ups while things are fresh." />
          ) : (
            <FollowUpGrid followUps={buckets.tomorrow} currency={currency} showEditActions />
          )}
        </TabsContent>

        <TabsContent value="upcoming">
          {buckets.upcoming.length === 0 ? (
            <EmptyState icon={BellRing} title="No upcoming follow-ups." description="Add follow-ups for appointments, payments and enquiries." />
          ) : (
            <FollowUpGrid followUps={buckets.upcoming} currency={currency} showEditActions />
          )}
        </TabsContent>

        <TabsContent value="completed">
          {buckets.completed.length === 0 ? (
            <EmptyState icon={Check} title="No completed follow-ups yet." description="Completed follow-ups will appear here." />
          ) : (
            <CompletedList followUps={buckets.completed} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FollowUpGrid({
  followUps,
  currency,
  showEditActions,
}: {
  followUps: FollowUp[];
  currency: CurrencyCode;
  showEditActions?: boolean;
}) {
  const snapshot = useSnapshot();
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {followUps.map((followUp) => {
        const customer = snapshot.customers.find((c) => c.id === followUp.customerId);
        const stats = customer ? computeCustomerStats(snapshot, customer.id) : null;
        return (
          <FollowUpCard
            key={followUp.id}
            followUp={followUp}
            customer={customer}
            currency={currency}
            pendingAmount={followUp.reason === "payment" ? (stats?.pending ?? 0) : 0}
            showEditActions={showEditActions}
          />
        );
      })}
    </div>
  );
}

function CompletedList({ followUps }: { followUps: FollowUp[] }) {
  const snapshot = useSnapshot();
  const restore = useDbAction(db.updateFollowUp, { successMessage: null });

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <ul className="divide-y divide-border/70">
        {followUps.map((f) => {
          const customer = snapshot.customers.find((c) => c.id === f.customerId);
          return (
            <li key={f.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{customer?.name ?? "Unknown customer"}</p>
                <p className="text-xs text-muted-foreground">
                  {f.date} · {f.notes || "Completed"}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 text-xs text-muted-foreground"
                onClick={() => void restore({ ...f, status: "pending", completedAt: undefined })}
              >
                Reopen
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
