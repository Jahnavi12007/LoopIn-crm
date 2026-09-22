import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, BellRing, ChevronRight, Clock, UserPlus, Users, Wallet } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { AvatarInitials } from "@/components/common/AvatarInitials";
import { TagPill } from "@/components/common/Badges";
import { FollowUpCard } from "@/components/common/FollowUpCard";
import { Button } from "@/components/ui/button";
import { useQuickActions } from "@/components/modals/QuickActions";
import { useAuth } from "@/context/AuthContext";
import { useSnapshot } from "@/hooks/useData";
import { computeCustomerStats, dashboardMetrics } from "@/services/selectors";
import { formatAmount, formatDateLabel, formatRelativeTime } from "@/lib/format";
import { todayISO } from "@/lib/format";

export default function Dashboard() {
  const { business } = useAuth();
  const snapshot = useSnapshot();
  const navigate = useNavigate();
  const quickActions = useQuickActions();

  const metrics = useMemo(() => dashboardMetrics(snapshot), [snapshot]);
  const currency = business?.currency ?? "INR";

  const recentCustomers = useMemo(
    () => [...snapshot.customers].filter((c) => !c.archived).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [snapshot.customers],
  );

  const pendingPayments = useMemo(
    () =>
      snapshot.customers
        .filter((c) => !c.archived)
        .map((c) => ({ customer: c, stats: computeCustomerStats(snapshot, c.id) }))
        .filter(({ stats }) => stats.pending > 0)
        .sort((a, b) => b.stats.pending - a.stats.pending)
        .slice(0, 5),
    [snapshot],
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = todayISO();

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`${greeting}, ${business?.name || "there"} 👋`}
        description={
          metrics.overdueFollowUps.length > 0
            ? `${metrics.overdueFollowUps.length} follow-up${metrics.overdueFollowUps.length > 1 ? "s" : ""} slipped past their date — a quick message keeps customers warm.`
            : "Here's who needs your attention today."
        }
        actions={
          <div className="hidden gap-2 sm:flex">
            <Button variant="outline" onClick={() => quickActions.openFollowUpForm()}>
              <BellRing className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Follow-up
            </Button>
            <Button onClick={() => quickActions.openCustomerForm()}>
              <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Customer
            </Button>
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={BellRing}
          label="Today's Follow-ups"
          value={String(metrics.todayFollowUps.length)}
          hint={metrics.todayFollowUps.length > 0 ? "Contact them today" : "All done for today"}
          onClick={() => navigate("/followups")}
        />
        <StatCard
          icon={Wallet}
          label="Pending Payments"
          value={formatAmount(metrics.pendingPayments, currency)}
          hint={`${pendingPayments.length > 0 ? `${pendingPayments.length}+ customers` : "Nothing pending"}`}
          tone={metrics.pendingPayments > 0 ? "warn" : "default"}
          onClick={() => navigate("/payments")}
        />
        <StatCard
          icon={Users}
          label="Active Customers"
          value={String(metrics.activeCustomers)}
          hint="People you serve"
          onClick={() => navigate("/customers")}
        />
        <StatCard
          icon={UserPlus}
          label="New Leads"
          value={String(metrics.newLeads)}
          hint="Waiting to convert"
          tone="positive"
          onClick={() => navigate("/customers?view=leads")}
        />
      </div>

      {/* Overdue alert */}
      {metrics.overdueFollowUps.length > 0 ? (
        <Link
          to="/followups"
          className="mt-4 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-800 transition-colors hover:bg-rose-50 focus-ring"
        >
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="font-medium">
            {metrics.overdueFollowUps.length} overdue follow-up{metrics.overdueFollowUps.length > 1 ? "s" : ""} — reschedule or complete{" "}
            {metrics.overdueFollowUps.length > 1 ? "them" : "it"} today.
          </span>
          <ChevronRight className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      ) : null}

      {/* Today's follow-ups */}
      <section className="mt-8" aria-labelledby="todays-followups">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="todays-followups" className="font-display text-lg font-semibold">
            Today's Follow-ups
          </h2>
          <span className="text-xs font-medium text-muted-foreground">{formatDateLabel(today)}</span>
        </div>

        {metrics.todayFollowUps.length === 0 ? (
          <EmptyState
            icon={BellRing}
            title="You're all caught up 🎉"
            description="No follow-ups due today. Add one so no customer slips through."
            action={
              <Button onClick={() => quickActions.openFollowUpForm()}>
                <BellRing className="mr-2 h-4 w-4" aria-hidden="true" />
                Add Follow-up
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {metrics.todayFollowUps.map((followUp) => {
              const customer = snapshot.customers.find((c) => c.id === followUp.customerId);
              const stats = customer ? computeCustomerStats(snapshot, customer.id) : null;
              return (
                <FollowUpCard
                  key={followUp.id}
                  followUp={followUp}
                  customer={customer}
                  currency={currency}
                  pendingAmount={followUp.reason === "payment" ? (stats?.pending ?? 0) : 0}
                />
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Pending payments */}
        <section aria-labelledby="pending-payments">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="pending-payments" className="font-display text-lg font-semibold">
              Pending Payments
            </h2>
            <Link to="/payments" className="flex items-center gap-0.5 text-sm font-semibold text-forest-700 hover:underline focus-ring rounded">
              View all <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          {pendingPayments.length === 0 ? (
            <EmptyState icon={Wallet} title="No pending payments." description="Every invoice is settled. Well done!" />
          ) : (
            <div className="space-y-2.5">
              {pendingPayments.map(({ customer, stats }) => (
                <Link
                  key={customer.id}
                  to={`/customers/${customer.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft transition-shadow hover:shadow-lifted focus-ring"
                >
                  <AvatarInitials name={customer.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{customer.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {stats.overdueAmount > 0
                        ? `${formatAmount(stats.overdueAmount, currency)} overdue`
                        : "Payment pending"}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-rose-600">{formatAmount(stats.pending, currency)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent customers */}
        <section aria-labelledby="recent-customers">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="recent-customers" className="font-display text-lg font-semibold">
              Recent Customers
            </h2>
            <Link to="/customers" className="flex items-center gap-0.5 text-sm font-semibold text-forest-700 hover:underline focus-ring rounded">
              View all <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          {recentCustomers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Your customer list is empty."
              description="Add your first customer to start tracking follow-ups and payments."
              action={
                <Button onClick={() => quickActions.openCustomerForm()}>
                  <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Add your first customer
                </Button>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {recentCustomers.map((customer) => {
                const stats = computeCustomerStats(snapshot, customer.id);
                return (
                  <Link
                    key={customer.id}
                    to={`/customers/${customer.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft transition-shadow hover:shadow-lifted focus-ring"
                  >
                    <AvatarInitials name={customer.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{customer.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {customer.type === "lead" ? "Lead" : "Customer"} ·{" "}
                        {stats.lastContactedAt ? `contacted ${formatRelativeTime(stats.lastContactedAt)}` : "never contacted"}
                      </span>
                    </span>
                    {customer.tags.slice(0, 1).map((tag) => (
                      <TagPill key={tag} tag={tag} />
                    ))}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Quick actions (mobile) */}
      <section className="mt-8 sm:hidden" aria-label="Quick actions">
        <h2 className="mb-3 font-display text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => quickActions.openCustomerForm()}
            className="focus-ring flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-2 py-4 text-xs font-semibold text-foreground shadow-soft active:scale-[0.98] transition-transform"
          >
            <UserPlus className="h-5 w-5 text-forest-700" aria-hidden="true" />
            Add Customer
          </button>
          <button
            type="button"
            onClick={() => quickActions.openFollowUpForm()}
            className="focus-ring flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-2 py-4 text-xs font-semibold text-foreground shadow-soft active:scale-[0.98] transition-transform"
          >
            <Clock className="h-5 w-5 text-forest-700" aria-hidden="true" />
            Add Follow-up
          </button>
          <button
            type="button"
            onClick={() => quickActions.openPaymentForm()}
            className="focus-ring flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-2 py-4 text-xs font-semibold text-foreground shadow-soft active:scale-[0.98] transition-transform"
          >
            <Wallet className="h-5 w-5 text-forest-700" aria-hidden="true" />
            Record Payment
          </button>
        </div>
      </section>
    </div>
  );
}
