import { NavLink, useNavigate } from "react-router-dom";
import { BarChart3, BellRing, Home, LayoutDashboard, MessagesSquare, MoreHorizontal, Plus, Settings, Users, Wallet } from "lucide-react";
import { useState } from "react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuickActions } from "@/components/modals/QuickActions";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const PRIMARY_ITEMS = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/followups", label: "Follow-ups", icon: BellRing },
  { to: "/payments", label: "Payments", icon: Wallet },
] as const;

/** Mobile: bottom navigation + a floating "+" button for the top 3 actions. */
export function BottomNav() {
  const quickActions = useQuickActions();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Quick actions"
            className="focus-ring fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-forest-700 text-white shadow-lifted transition-transform active:scale-95 lg:hidden"
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="mb-1 w-48">
          <DropdownMenuItem onClick={() => quickActions.openCustomerForm()}>
            <Users className="mr-2 h-4 w-4" aria-hidden="true" />
            Add Customer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => quickActions.openFollowUpForm()}>
            <BellRing className="mr-2 h-4 w-4" aria-hidden="true" />
            Add Follow-up
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => quickActions.openPaymentForm()}>
            <Wallet className="mr-2 h-4 w-4" aria-hidden="true" />
            Record Payment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <nav
        aria-label="Bottom navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto flex h-16 max-w-md items-stretch">
          {PRIMARY_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors focus-ring",
                  isActive ? "text-forest-700" : "text-muted-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("h-5 w-5", isActive && "stroke-[2.4]")} aria-hidden="true" />
                  {label}
                </>
              )}
            </NavLink>
          ))}

          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground focus-ring"
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                More
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-display text-left">More</SheetTitle>
              </SheetHeader>
              <MobileMoreMenu onNavigate={() => setMoreOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}

function MobileMoreMenu({ onNavigate }: { onNavigate: () => void }) {
  const navigate = useNavigate();
  const { business, user, logout } = useAuth();

  const items = [
    { label: "Analytics", icon: BarChart3, action: () => navigate("/analytics") },
    { label: "Templates", icon: MessagesSquare, action: () => navigate("/templates") },
    { label: "Settings", icon: Settings, action: () => navigate("/settings") },
  ];

  return (
    <div className="flex h-full flex-col px-4 pb-6">
      <div className="mt-2 flex items-center gap-3 rounded-2xl bg-forest-800 p-4 text-white">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-400 font-display text-base font-bold text-forest-950">
          {(business?.name ?? user?.name ?? "?").slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{business?.name || "Your business"}</span>
          <span className="block truncate text-xs text-white/70">{user?.email}</span>
        </span>
      </div>

      <div className="mt-4 space-y-1">
        {items.map(({ label, icon: Icon, action }) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              action();
              onNavigate();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-ring"
          >
            <Icon className="h-[18px] w-[18px] text-forest-700" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={logout}
        className="mt-auto rounded-xl px-3 py-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-rose-50 focus-ring"
      >
        Log out
      </button>
    </div>
  );
}

export { LayoutDashboard };
