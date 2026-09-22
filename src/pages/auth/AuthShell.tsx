import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { LogoMark } from "@/components/layout/Sidebar";

/** Shared shell for login / signup / forgot-password screens. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Link to="/" className="mb-8 flex items-center gap-2.5 focus-ring rounded-xl" aria-label="LoopIn home">
        <LogoMark className="h-10 w-10" />
        <span className="font-display text-2xl font-semibold tracking-tight">LoopIn</span>
      </Link>

      <div className="w-full max-w-md animate-pop rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>

      {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
    </div>
  );
}
