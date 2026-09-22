import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";

import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Customers = lazy(() => import("./pages/Customers"));
const CustomerProfile = lazy(() => import("./pages/CustomerProfile"));
const FollowUps = lazy(() => import("./pages/FollowUps"));
const Payments = lazy(() => import("./pages/Payments"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Templates = lazy(() => import("./pages/Templates"));
const Settings = lazy(() => import("./pages/Settings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-forest-200 border-t-forest-700" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    </div>
  );
}

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>;
}

/** Only for signed-in users who finished onboarding. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, business, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (business && !business.onboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

/** Auth pages bounce to the app if already signed in. */
function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user, business, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (user) return <Navigate to={business?.onboarded ? "/dashboard" : "/onboarding"} replace />;
  return <>{children}</>;
}

/** Onboarding is only for signed-in users who haven't finished setup. */
function RequireOnboarding({ children }: { children: ReactNode }) {
  const { user, business, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (business?.onboarded) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster position="top-center" richColors />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />

              <Route
                path="/login"
                element={withSuspense(
                  <RedirectIfAuthed>
                    <Login />
                  </RedirectIfAuthed>,
                )}
              />
              <Route
                path="/signup"
                element={withSuspense(
                  <RedirectIfAuthed>
                    <Signup />
                  </RedirectIfAuthed>,
                )}
              />
              <Route
                path="/forgot-password"
                element={withSuspense(
                  <RedirectIfAuthed>
                    <ForgotPassword />
                  </RedirectIfAuthed>,
                )}
              />
              <Route path="/reset-password" element={withSuspense(<ResetPassword />)} />
              <Route
                path="/onboarding"
                element={withSuspense(
                  <RequireOnboarding>
                    <Onboarding />
                  </RequireOnboarding>,
                )}
              />

              <Route
                element={
                  <RequireAuth>
                    <AppShell />
                  </RequireAuth>
                }
              >
                <Route path="/dashboard" element={withSuspense(<Dashboard />)} />
                <Route path="/customers" element={withSuspense(<Customers />)} />
                <Route path="/customers/:customerId" element={withSuspense(<CustomerProfile />)} />
                <Route path="/followups" element={withSuspense(<FollowUps />)} />
                <Route path="/payments" element={withSuspense(<Payments />)} />
                <Route path="/analytics" element={withSuspense(<Analytics />)} />
                <Route path="/templates" element={withSuspense(<Templates />)} />
                <Route path="/settings" element={withSuspense(<Settings />)} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
