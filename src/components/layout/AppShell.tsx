import { Outlet } from "react-router-dom";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { OfflineBanner } from "@/components/common/OfflineBanner";
import { QuickActionsProvider } from "@/components/modals/QuickActions";

/** Authenticated app chrome: sidebar (desktop), topbar, bottom nav + FAB (mobile). */
export function AppShell() {
  return (
    <QuickActionsProvider>
      <div className="min-h-screen bg-background">
        <OfflineBanner />
        <Sidebar />
        <div className="lg:pl-60">
          <Topbar />
          <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 lg:px-8 lg:pb-16">
            <Outlet />
          </main>
        </div>
        <BottomNav />
      </div>
    </QuickActionsProvider>
  );
}
