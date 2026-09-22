import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, ChevronDown, LogOut, Search, Settings as SettingsIcon, UserRound } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { GlobalSearch, SearchTrigger } from "@/components/layout/GlobalSearch";
import { LogoMark } from "@/components/layout/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useData";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Topbar() {
  const { business, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 lg:px-8">
        <div className="lg:hidden">
          <LogoMark className="h-9 w-9" />
        </div>

        <div className="hidden lg:block">
          <p className="font-display text-lg font-semibold leading-5">{business?.name || "Your business"}</p>
          <p className="text-xs text-muted-foreground">Customer follow-up workspace</p>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <SearchTrigger onClick={() => setSearchOpen(true)} />

          <Popover
            open={bellOpen}
            onOpenChange={(open) => {
              setBellOpen(open);
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                className="focus-ring relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted lg:h-9 lg:w-9"
              >
                <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
                {unreadCount > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-forest-950"
                  >
                    {unreadCount}
                  </span>
                ) : null}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="font-display text-sm font-semibold">
                  Notifications{unreadCount > 0 ? ` · ${unreadCount} new` : ""}
                </p>
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    className="flex items-center gap-1 rounded text-xs font-semibold text-forest-700 hover:underline focus-ring"
                  >
                    <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Mark all read
                  </button>
                ) : null}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    You're all caught up 🎉
                  </p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        if (!n.read) void markRead(n.id);
                        setBellOpen(false);
                        navigate(n.kind === "payments-overdue" ? "/payments" : "/followups");
                      }}
                      className={cn(
                        "relative block w-full border-b border-border/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted focus-ring",
                        !n.read && "bg-gold-50/40",
                      )}
                    >
                      <span className="flex items-start gap-2">
                        {!n.read ? (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-500" aria-label="Unread" />
                        ) : null}
                        <span className="min-w-0">
                          <span className={cn("block text-sm", n.read ? "font-medium text-muted-foreground" : "font-semibold text-foreground")}>
                            {n.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{n.body}</span>
                          <span className="mt-1 block text-[11px] text-muted-foreground/80">
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
              <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
                Turning a category off in Settings stops new notifications — history is kept.
              </p>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 gap-2 rounded-full px-2 lg:h-9">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-800 text-xs font-bold text-white">
                  {(user?.name ?? "?").slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-28 truncate text-sm font-medium sm:block">{user?.name}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <UserRound className="mr-2 h-4 w-4" aria-hidden="true" />
                Business profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <SettingsIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}

export { Search as SearchIcon, cn };
