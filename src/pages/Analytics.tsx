import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, Repeat, TrendingDown, Users, Wallet } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useSnapshot } from "@/hooks/useData";
import { analytics } from "@/services/selectors";
import { formatAmount, formatAmountCompact } from "@/lib/format";

/** Simple, honest analytics: "Is my customer management improving?" */
export default function Analytics() {
  const { business } = useAuth();
  const snapshot = useSnapshot();
  const data = useMemo(() => analytics(snapshot), [snapshot]);
  const currency = business?.currency ?? "INR";

  const hasData = data.totalCustomers > 0 || data.followUpsCompletedTotal > 0;

  if (!hasData) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Analytics" description="A simple answer to: is my customer management improving?" />
        <EmptyState
          icon={Users}
          title="Not enough data yet."
          description="Add customers, complete follow-ups, and record payments — your trends will appear here within a couple of weeks."
        />
      </div>
    );
  }

  const repeatRate = data.totalCustomers > 0 ? Math.round((data.repeatCustomers / data.totalCustomers) * 100) : 0;

  return (
    <div className="animate-fade-up">
      <PageHeader title="Analytics" description="A simple answer to: is my customer management improving?" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="New Customers" value={String(data.months.at(-1)?.newCustomers ?? 0)} hint="This month" />
        <StatCard
          icon={CheckCircle2}
          label="Follow-ups Completed"
          value={String(data.followUpsCompletedTotal)}
          hint={`${data.followUpsOverdueCount} overdue now`}
          tone={data.followUpsOverdueCount > 0 ? "warn" : "positive"}
        />
        <StatCard icon={Wallet} label="Collected This Month" value={formatAmount(data.collectedThisMonth, currency)} tone="positive" />
        <StatCard
          icon={TrendingDown}
          label="Outstanding"
          value={formatAmount(data.outstanding, currency)}
          hint="Still to collect"
          tone={data.outstanding > 0 ? "warn" : "default"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft" aria-labelledby="chart-collected">
          <h2 id="chart-collected" className="font-display text-base font-semibold">
            Payments Collected
          </h2>
          <p className="text-xs text-muted-foreground">Last 6 months</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.months} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(44 22% 88%)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(152 8% 40%)" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="hsl(152 8% 40%)"
                  tickFormatter={(v: number) => formatAmountCompact(v, currency)}
                  width={58}
                />
                <Tooltip
                  formatter={(value) => [formatAmount(Number(value), currency), "Collected"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(44 22% 88%)", fontSize: 13 }}
                />
                <Bar dataKey="collected" fill="hsl(157 44% 30%)" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft" aria-labelledby="chart-activity">
          <h2 id="chart-activity" className="font-display text-base font-semibold">
            Customers & Follow-ups
          </h2>
          <p className="text-xs text-muted-foreground">New customers vs follow-ups completed, last 6 months</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.months} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(44 22% 88%)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(152 8% 40%)" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="hsl(152 8% 40%)" width={40} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(44 22% 88%)", fontSize: 13 }} />
                <Bar dataKey="newCustomers" name="New customers" fill="hsl(40 65% 54%)" radius={[6, 6, 0, 0]} maxBarSize={22} />
                <Bar dataKey="followUpsCompleted" name="Follow-ups done" fill="hsl(157 44% 30%)" radius={[6, 6, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft" aria-labelledby="repeat-heading">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-50 text-gold-700">
            <Repeat className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="repeat-heading" className="font-display text-base font-semibold">
              Repeat customers
            </h2>
            <p className="text-xs text-muted-foreground">Customers who have paid you at least once</p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-display text-2xl font-semibold">{repeatRate}%</p>
            <p className="text-xs text-muted-foreground">
              {data.repeatCustomers} of {data.totalCustomers}
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-forest-600 to-forest-500 transition-all" style={{ width: `${repeatRate}%` }} />
        </div>
      </section>
    </div>
  );
}
