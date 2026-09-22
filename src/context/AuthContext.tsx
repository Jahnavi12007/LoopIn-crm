import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import * as auth from "@/services/auth";
import { ensureDefaultTemplates, updateBusiness as persistBusiness } from "@/services/db";
import type { Business } from "@/types";

interface AuthContextValue {
  isLoading: boolean;
  user: { id: string; name: string; email: string } | null;
  business: Business | null;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginDemo: () => void;
  logout: () => void;
  setBusiness: (business: Business) => void;
  completeOnboarding: (fields: Partial<Business>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [business, setBusinessState] = useState<Business | null>(null);

  useEffect(() => {
    try {
      const session = auth.getSession();
      if (session) {
        const loaded = auth.getBusinessById(session.businessId);
        const account = auth.getUserById(session.userId);
        if (loaded && account) {
          setBusinessState(loaded);
          setUser({ id: account.id, name: account.name, email: account.email });
        } else {
          auth.logout();
        }
      }
    } catch {
      auth.logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setBusiness = useCallback((next: Business) => {
    persistBusiness(next);
    setBusinessState(next);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await auth.login(email, password);
    const loaded = auth.getBusinessById(session.businessId);
    const account = auth.getUserById(session.userId);
    if (loaded && account) {
      setBusinessState(loaded);
      setUser({ id: account.id, name: account.name, email: account.email });
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    await auth.signUp({ name, email, password });
    const session = auth.getSession();
    if (session) {
      const loaded = auth.getBusinessById(session.businessId);
      const account = auth.getUserById(session.userId);
      if (loaded && account) {
        setBusinessState(loaded);
        setUser({ id: account.id, name: account.name, email: account.email });
      }
    }
  }, []);

  const loginDemo = useCallback(() => {
    const session = auth.loginDemo();
    const loaded = auth.getBusinessById(session.businessId);
    const account = auth.getUserById(session.userId);
    if (loaded && account) {
      setBusinessState(loaded);
      setUser({ id: account.id, name: account.name, email: account.email });
    }
  }, []);

  const logout = useCallback(() => {
    auth.logout();
    setBusinessState(null);
    setUser(null);
  }, []);

  const completeOnboarding = useCallback(
    (fields: Partial<Business>) => {
      if (!business) return;
      const next: Business = { ...business, ...fields, onboarded: true };
      persistBusiness(next);
      ensureDefaultTemplates(next.id);
      setBusinessState(next);
    },
    [business],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      user,
      business,
      isDemo: business?.id === "b_demo",
      login,
      signup,
      loginDemo,
      logout,
      setBusiness,
      completeOnboarding,
    }),
    [isLoading, user, business, login, signup, loginDemo, logout, setBusiness, completeOnboarding],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
