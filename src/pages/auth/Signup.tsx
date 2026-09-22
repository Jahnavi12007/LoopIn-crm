import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthShell } from "@/pages/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { isValidEmail } from "@/lib/format";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Please enter your name.");
    if (!isValidEmail(email)) return setError("Please enter a valid email address.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    setIsBusy(true);
    try {
      await signup(name, email, password);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't create your account. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <AuthShell
      title="Start free"
      subtitle="Set up your workspace in under a minute. No credit card needed."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-forest-700 hover:underline focus-ring rounded">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="signup-name">Your name</Label>
          <Input
            id="signup-name"
            autoComplete="name"
            placeholder="e.g. Anita Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@business.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        {error ? (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={isBusy}>
          {isBusy ? "Creating account…" : "Create Free Account"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Free plan: up to 50 customers, follow-ups and payment tracking included.
        </p>
      </form>
    </AuthShell>
  );
}
