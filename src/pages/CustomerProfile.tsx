import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArchiveRestore, ArrowUpDown, ChevronRight, Search, UserPlus, Users } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { AvatarInitials } from "@/components/common/AvatarInitials";
import { TagPill } from "@/components/common/Badges";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuickActions } from "@/components/modals/QuickActions";
import { useAuth } from "@/context/AuthContext";
import { useDbAction, useSnapshot } from "@/hooks/useData";
import { useDebounce } from "@/hooks/useDebounce";
import { computeCustomerStats } from "@/services/selectors";
import { formatAmount, formatRelativeTime } from "@/lib/format";
import { CUSTOMER_TAG_LABELS } from "@/types";
import type { CustomerTag } from "@/types";
import { cn } from "@/lib/utils";
import * as db from "@/services/db";

type SortKey = "recent" | "name" | "pending" | "next-followup";
type View = "active" | "leads" | "archived";
const PAGE_SIZE = 20;

export default function Customers() {
  const { business } = useAuth();
  const snapshot = useSnapshot();
  const quickActions = useQuickActions();
  const currency = business?.currency ?? "INR";
  const [searchParams, setSearchParams] = useSearchParams();
  const view: View = searchParams.get("view") === "leads" ? "leads" : searchParams.get("view") === "archived" ? "archived" : "active";

  const setView = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (next === "active") params.delete("view");
    else params.set("view", next);
    setSearchParams(params, { replace: true });
    setVisibleCount(PAGE_SIZE);
  };

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);
  const [tagFilter, setTagFilter] = useState<CustomerTag | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const rows = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    let list = snapshot.customers
      .filter((c) => (view === "archived" ? c.archived : !c.archived && (view === "leads" ? c.type === "lead" : c.type !== "lead")))
      .filter((c) => (tagFilter === "all" ? true : c.tags.includes(tagFilter)))
      .filter((c) =>
        query
          ? c.name.toLowerCase().includes(query) ||
            c.phone.replace(/\D/g, "").includes(query.replace(/\D/g, "") || "\u0000") ||
            c.tags.some((t) => CUSTOMER_TAG_LABELS[t].toLowerCase().includes(query))
          : true,
      )
      .map((c) => ({ customer: c, stats: computeCustomerStats(snapshot, c.id) }));

    list.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.customer.name.localeCompare(b.customer.name);
        case "pending":
          return b.stats.pending - a.stats.pending;
        case "next-followup": {
          const aNext = a.stats.nextFollowUp?.date ?? "9999";
          const bNext = b.stats.nextFollowUp?.date ?? "9999";
          return aNext.localeCompare(bNext);
        }
        default:
          return b.customer.createdAt.localeCompare(a.customer.createdAt);
      }
    });
    return list;
  }, [snapshot, debouncedSearch, tagFilter, sortKey, view]);

  const restoreCustomer = useDbAction(
    (businessId: string, id: string) => db.setCustomerArchived(businessId, id, false),
    { successMessage: "Customer restored" },
  );

  const visible = rows.slice(0, visibleCount);
  const hasFilters = debouncedSearch.trim() !== "" || tagFilter !== "all";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Customers"
        description={
          view === "leads"
            ? `${rows.length} ${rows.length === 1 ? "lead" : "leads"} waiting to convert`
            : view === "archived"
              ? `${rows.length} archived ${rows.length === 1 ? "customer" : "customers"} — history is kept, restore anytime`
              : `${rows.length} ${rows.length === 1 ? "customer" : "customers"}${hasFilters ? " matching your filters" : ""}`
        }
        actions={
          <Button onClick={() => quickActions.openCustomerForm()}>
            <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add Customer
          </Button>
        }
      />

      {/* Active customers / leads / archived */}
      <Tabs value={view} onValueChange={setView} className="mb-4">
        <TabsList>
          <TabsTrigger value="active">All Customers</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search + filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search by name, phone, or tag…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className="pl-9"
            aria-label="Search customers"
          />
        </div>
        <div className="flex gap-2">
          <Select value={tagFilter} onValueChange={(v) => { setTagFilter(v as CustomerTag | "all"); setVisibleCount(PAGE_SIZE); }}>
            <SelectTrigger className="w-[140px]" aria-label="Filter by tag">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {(Object.keys(CUSTOMER_TAG_LABELS) as CustomerTag[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {CUSTOMER_TAG_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-[168px]" aria-label="Sort customers">
              <ArrowUpDown className="mr-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently added</SelectItem>
              <SelectItem value="name">Name (A–Z)</SelectItem>
              <SelectItem value="pending">Highest pending</SelectItem>
              <SelectItem value="next-followup">Next follow-up</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {rows.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={Search}
            title="No customers match your search."
            description="Try a different name, phone number, or clear the filters."
          />
        ) : view === "archived" ? (
          <EmptyState
            icon={ArchiveRestore}
            title="No archived customers."
            description="When you archive a customer, they'll be kept safely here with their full history."
          />
        ) : view === "leads" ? (
          <EmptyState
            icon={UserPlus}
            title="No leads yet."
            description="Add a customer with type “Lead” to track people who haven't bought yet."
            action={
              <Button onClick={() => quickActions.openCustomerForm()}>
                <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                Add Lead
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Users}
            title="Your customer list is empty."
            description="Add customers one by one — it takes less than 30 seconds each."
            action={
              <Button onClick={() => quickActions.openCustomerForm()}>
                <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                Add your first customer
              </Button>
            }
          />
        )
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-soft md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-cream-50/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-5 py-3">Customer</th>
                  <th scope="col" className="px-5 py-3">Tags</th>
                  <th scope="col" className="px-5 py-3 text-right">Pending</th>
                  <th scope="col" className="px-5 py-3">Last contacted</th>
                  <th scope="col" className="px-5 py-3">Next follow-up</th>
                  <th scope="col" className="w-10" aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {visible.map(({ customer, stats }) => (
                  <tr key={customer.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-cream-50/50">
                    <td className="px-5 py-3.5">
                      <Link to={`/customers/${customer.id}`} className="flex items-center gap-3 focus-ring rounded">
                        <AvatarInitials name={customer.name} className="h-9 w-9" />
                        <span>
                          <span className="block font-semibold text-foreground">{customer.name}</span>
                          <span className="block text-xs text-muted-foreground">{customer.phone}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex flex-wrap gap-1">
                        {customer.tags.slice(0, 2).map((t) => (
                          <TagPill key={t} tag={t} />
                        ))}
                      </span>
                    </td>
                    <td className={cn("px-5 py-3.5 text-right font-semibold", stats.pending > 0 ? "text-rose-600" : "text-forest-600")}>
                      {stats.pending > 0 ? formatAmount(stats.pending, currency) : "Settled"}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {stats.lastContactedAt ? formatRelativeTime(stats.lastContactedAt) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {stats.nextFollowUp ? formatDateSafe(stats.nextFollowUp.date) : "—"}
                    </td>
                    <td className="px-2 py-3.5">
                      {view === "archived" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5 px-2 text-xs"
                          onClick={() => void restoreCustomer(customer.id)}
                        >
                          <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
                          Restore
                        </Button>
                      ) : (
                        <Link to={`/customers/${customer.id}`} aria-label={`Open ${customer.name}`} className="focus-ring rounded p-1 text-muted-foreground hover:text-foreground">
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2.5 md:hidden">
            {visible.map(({ customer, stats }) => (
              <Link
                key={customer.id}
                to={`/customers/${customer.id}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-soft active:scale-[0.99] transition-transform focus-ring"
              >
                <AvatarInitials name={customer.name} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{customer.name}</span>
                  </span>
                  <span className="mt-0.5 flex flex-wrap gap-1">
                    {customer.tags.slice(0, 2).map((t) => (
                      <TagPill key={t} tag={t} />
                    ))}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  {stats.pending > 0 ? (
                    <span className="block text-sm font-bold text-rose-600">{formatAmount(stats.pending, currency)}</span>
                  ) : null}
                  <span className="block text-[11px] text-muted-foreground">
                    {stats.lastContactedAt ? formatRelativeTime(stats.lastContactedAt) : "New"}
                  </span>
                </span>
                {view === "archived" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0 gap-1.5 px-2 text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      void restoreCustomer(customer.id);
                    }}
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
                    Restore
                  </Button>
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
              </Link>
            ))}
          </div>

          {rows.length > visibleCount ? (
            <div className="mt-5 text-center">
              <Button variant="outline" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
                Load more ({rows.length - visibleCount} remaining)
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function formatDateSafe(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en", { day: "numeric", month: "short" });
}
