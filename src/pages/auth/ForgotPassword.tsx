import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, MailCheck } from "lucide-react";

import { AuthShell } from "@/pages/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/services/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsBusy(true);
    try {
      const token = await requestPasswordReset(email);
      if (!token) {
        setError("We couldn't find an account with that email. Check the spelling or create a new account.");
        return;
      }
      setResetToken(token);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your account email and we'll help you get back in."
      footer={
        <Link to="/login" className="font-semibold text-forest-700 hover:underline focus-ring rounded">
          Back to login
        </Link>
      }
    >
      {resetToken ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 text-forest-600">
            <MailCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">
            Request received. Email delivery isn't connected in this local build, so your secure one-time reset link is
            shown below. It expires in 30 minutes and can only be used once.
          </p>
          <Button asChild className="w-full" size="lg">
            <Link to={`/reset-password?token=${encodeURIComponent(resetToken)}`}>
              <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />
              Set a new password
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Back to login</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="you@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" disabled={isBusy || !email.includes("@")}>
            {isBusy ? "Checking…" : "Continue"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
