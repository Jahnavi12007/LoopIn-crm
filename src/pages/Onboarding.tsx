import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, PartyPopper } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { CATEGORY_LABELS } from "@/types";
import type { BusinessCategory, CurrencyCode, CustomerSource, OnboardingGoal } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Short, warm onboarding: business setup → category → current tools → goals → ready.
 */

const SOURCE_OPTIONS: Array<{ value: CustomerSource; label: string; hint: string }> = [
  { value: "whatsapp", label: "WhatsApp", hint: "Chats and calls" },
  { value: "notebook", label: "Notebook", hint: "Paper and memory" },
  { value: "sheets", label: "Excel / Sheets", hint: "Spreadsheets" },
  { value: "crm", label: "Another CRM", hint: "Too complicated" },
  { value: "other", label: "Other", hint: "Something else" },
];

const GOAL_OPTIONS: Array<{ value: OnboardingGoal; label: string }> = [
  { value: "follow-ups", label: "Customer follow-ups" },
  { value: "payments", label: "Payment tracking" },
  { value: "organization", label: "Customer organization" },
  { value: "repeat-customers", label: "Repeat customers" },
  { value: "all", label: "All of these" },
];

const CURRENCIES: CurrencyCode[] = ["INR", "USD", "EUR", "GBP", "AED"];

export default function Onboarding() {
  const { business, user, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [businessName, setBusinessName] = useState(business?.name ?? "");
  const [phone, setPhone] = useState(business?.phone ?? "");
  const [city, setCity] = useState(business?.city ?? "");
  const [currency, setCurrency] = useState<CurrencyCode>(business?.currency ?? "INR");
  const [category, setCategory] = useState<BusinessCategory>(business?.category ?? "other");
  const [howManage, setHowManage] = useState<CustomerSource | null>(business?.howManage ?? null);
  const [goals, setGoals] = useState<OnboardingGoal[]>(business?.goals ?? []);

  const firstName = (user?.name ?? business?.ownerName ?? "").split(" ")[0];

  const steps = [
    // 0 — welcome
    {
      title: `Let's set up your business, ${firstName}`,
      subtitle: "Four quick questions. You'll be up and running in a minute.",
      valid: true,
    },
    // 1 — business details
    {
      title: "Tell us about your business",
      subtitle: "This appears in your WhatsApp messages to customers.",
      valid: businessName.trim().length >= 2 && phone.replace(/\D/g, "").length >= 10,
    },
    // 2 — category
    {
      title: "What kind of business do you run?",
      subtitle: "We'll tailor your workspace to fit.",
      valid: true,
    },
    // 3 — current tools
    {
      title: "How do you manage customers today?",
      subtitle: "There's no wrong answer — this is where you are now.",
      valid: howManage !== null,
    },
    // 4 — goals
    {
      title: "What do you want to improve?",
      subtitle: "Pick as many as you like.",
      valid: goals.length > 0,
    },
  ] as const;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (!current.valid) return;
    if (isLast) {
      setIsSaving(true);
      completeOnboarding({
        name: businessName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        currency,
        category,
        howManage,
        goals,
      });
      setStep(step + 1);
      return;
    }
    setStep((s) => s + 1);
  };

  if (step === steps.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md animate-pop rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-50 text-forest-600">
            <PartyPopper className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold">Your workspace is ready</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {businessName.trim() || "Your business"} is set up. Start by adding a few customers and scheduling your
            first follow-ups.
          </p>
          <Button
            className="mt-6 w-full"
            size="lg"
            onClick={() => {
              navigate("/dashboard", { replace: true });
            }}
          >
            Open Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < step ? "bg-forest-600" : i === step ? "bg-gold-400" : "bg-border",
              )}
              aria-hidden="true"
            />
          ))}
        </div>

        <div className="animate-pop rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8" key={step}>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{current.title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{current.subtitle}</p>

          <div className="mt-6 space-y-5">
            {step === 1 ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="ob-name">Business name *</Label>
                  <Input
                    id="ob-name"
                    placeholder="e.g. Glow Studio"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ob-phone">Your WhatsApp number *</Label>
                  <Input
                    id="ob-phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ob-city">City</Label>
                    <Input id="ob-city" placeholder="e.g. Bengaluru" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ob-currency">Currency</Label>
                    <select
                      id="ob-currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                      className="focus-ring h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {(Object.keys(CATEGORY_LABELS) as BusinessCategory[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      "focus-ring rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
                      category === c
                        ? "border-forest-600 bg-forest-50 text-forest-800"
                        : "border-border bg-card text-muted-foreground hover:border-forest-300",
                    )}
                  >
                    {CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-2.5">
                {SOURCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setHowManage(opt.value)}
                    className={cn(
                      "focus-ring flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                      howManage === opt.value
                        ? "border-forest-600 bg-forest-50"
                        : "border-border bg-card hover:border-forest-300",
                    )}
                  >
                    <span>
                      <span className="block text-sm font-semibold">{opt.label}</span>
                      <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                    </span>
                    {howManage === opt.value ? <Check className="h-4 w-4 text-forest-600" aria-hidden="true" /> : null}
                  </button>
                ))}
              </div>
            ) : null}

            {step === 4 ? (
              <div className="grid grid-cols-1 gap-2.5">
                {GOAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setGoals((prev) => (prev.includes(opt.value) ? prev.filter((g) => g !== opt.value) : [...prev, opt.value]))
                    }
                    className={cn(
                      "focus-ring flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors",
                      goals.includes(opt.value)
                        ? "border-forest-600 bg-forest-50 text-forest-800"
                        : "border-border bg-card text-muted-foreground hover:border-forest-300",
                    )}
                  >
                    {opt.label}
                    {goals.includes(opt.value) ? <Check className="h-4 w-4 text-forest-600" aria-hidden="true" /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="text-muted-foreground"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Back
          </Button>
          <Button type="button" onClick={handleNext} disabled={!current.valid || isSaving} size="lg">
            {isLast ? (isSaving ? "Setting up…" : "Finish Setup") : "Continue"}
            {!isLast ? <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" /> : null}
          </Button>
        </div>
      </div>
    </div>
  );
}
