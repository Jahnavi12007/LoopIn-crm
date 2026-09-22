import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface State {
  hasError: boolean;
}

/** Catches render errors and shows a friendly recovery screen, never raw stack traces. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error", error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="font-display text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            We couldn't display this page. Reloading usually fixes it — your data is safe.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground focus-ring"
          >
            Reload Nudge
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
