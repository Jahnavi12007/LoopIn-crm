import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

import { AuthShell } from "@/pages/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/services/auth";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Choose a password with at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setIsBusy(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle={token ? "Choose a new password for your account." : "This reset link is missing its token."}
      footer={
        <Link to="/login" className="font-semibold text-forest-700 hover:underline focus-ring rounded">
          Back to login
        </Link>
      }
    >
      {success ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 text-forest-600">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">Your password has been updated. Log in with your new password.</p>
          <Button asChild className="w-full" size="lg">
            <Link to="/login">Go to login</Link>
          </Button>
        </div>
      ) : !token ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            This link is missing its reset token. Request a new one to continue.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="reset-password">New password</Label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reset-confirm">Confirm new password</Label>
            <Input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" disabled={isBusy || !password || !confirm}>
            {isBusy ? "Updating…" : "Update Password"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
