import { NavLink, useNavigate } from "react-router-dom";
import { BarChart3, BellRing, LayoutDashboard, MessagesSquare, Settings, Users, Wallet } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { usePlan } from "@/hooks/useData";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/followups", label: "Follow-ups", icon: BellRing },
  { to: "/payments", label: "Payments", icon: Wallet },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

const SECONDARY_ITEMS = [
  { to: "/templates", label: "Templates", icon: MessagesSquare },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const { business, user } = useAuth();
  const { planLabel } = usePlan();
  const navigate = useNavigate();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar text-sidebar-foreground lg:flex">
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2.5 px-6 pb-2 pt-6 text-left focus-ring rounded-none"
      >
        <LogoMark />
        <span className="font-display text-xl font-semibold tracking-tight text-white">LoopIn</span>
      </button>

      <nav aria-label="Main" className="mt-6 flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-ring",
                isActive ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            {label}
          </NavLink>
        ))}

        <div className="mx-3 my-4 border-t border-sidebar-border" aria-hidden="true" />

        {SECONDARY_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-ring",
                isActive ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <NavLink
        to="/settings"
        className="m-3 flex items-center gap-3 rounded-xl bg-sidebar-accent/70 p-3 transition-colors hover:bg-sidebar-accent focus-ring"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-400 font-display text-sm font-bold text-forest-950">
          {(business?.name ?? user?.name ?? "?").slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">{business?.name || "Your business"}</span>
          <span className="block text-xs text-sidebar-foreground/80">{planLabel} plan</span>
        </span>
      </NavLink>
    </aside>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-500 text-forest-950 shadow-inner",
        className,
      )}
    >
      <BellRing className="h-4 w-4" strokeWidth={2.5} />
    </span>
  );
}
