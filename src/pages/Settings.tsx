import { useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { usePlan, useSnapshot } from "@/hooks/useData";
import { hashPassword } from "@/services/auth";
import { storage } from "@/services/storage";
import * as db from "@/services/db";
import { CATEGORY_LABELS, FREE_CUSTOMER_LIMIT, PLAN_CUSTOMER_LIMITS, PLAN_LABELS } from "@/types";
import type { BusinessCategory, CurrencyCode, Plan } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CURRENCIES: CurrencyCode[] = ["INR", "USD", "EUR", "GBP", "AED"];

export default function Settings() {
  const { business } = useAuth();
  const { customerCount, plan } = usePlan();

  return (
    <div className="animate-fade-up">
      <PageHeader title="Settings" description="Your business, account, notifications, and subscription." />
      <Tabs defaultValue="business">
        <TabsList className="mb-5 h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          {business ? <BusinessTab /> : null}
        </TabsContent>

        <TabsContent value="account">
          <AccountTab />
        </TabsContent>

        <TabsContent value="notifications">
          {business ? <NotificationsTab /> : null}
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionTab customerCount={customerCount} />
        </TabsContent>
      </Tabs>
      <p className="mt-6 text-xs text-muted-foreground">
        {customerCount} active {customerCount === 1 ? "customer" : "customers"} ·{" "}
        {PLAN_CUSTOMER_LIMITS[plan] != null
          ? `${PLAN_CUSTOMER_LIMITS[plan]} allowed on ${PLAN_LABELS[plan]}`
          : `unlimited on ${PLAN_LABELS[plan]}`}
      </p>
    </div>
  );
}

function BusinessTab() {
  const { business, setBusiness } = useAuth();
  const [name, setName] = useState(business?.name ?? "");
  const [phone, setPhone] = useState(business?.phone ?? "");
  const [city, setCity] = useState(business?.city ?? "");
  const [category, setCategory] = useState<BusinessCategory>(business?.category ?? "other");
  const [currency, setCurrency] = useState<CurrencyCode>(business?.currency ?? "INR");
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!business) return;
    if (name.trim().length < 2) return setError("Please enter your business name.");
    if (phone.replace(/\D/g, "").length < 10) return setError("Enter a valid WhatsApp number.");
    setError(null);
    setBusiness({ ...business, name: name.trim(), phone: phone.trim(), city: city.trim(), category, currency });
    toast.success("Business profile updated");
  };

  return (
    <div className="max-w-xl space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="space-y-1.5">
        <Label htmlFor="set-name">Business name</Label>
        <Input id="set-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="set-phone">WhatsApp / Phone</Label>
          <Input id="set-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="set-city">City</Label>
          <Input id="set-city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="set-category">Category</Label>
          <select
            id="set-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as BusinessCategory)}
            className="focus-ring h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
          >
            {(Object.keys(CATEGORY_LABELS) as BusinessCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="set-currency">Currency</Label>
          <select
            id="set-currency"
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

      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      <Button onClick={handleSave}>Save Changes</Button>

      <div className="rounded-xl border border-dashed border-border p-4">
        <p className="text-sm font-semibold">WhatsApp Templates</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Templates are managed on their own page — create payment reminders, follow-ups, and more.
        </p>
        <Button variant="outline" size="sm" className="mt-3" asChild>
          <Link to="/templates">Manage Templates</Link>
        </Button>
      </div>
    </div>
  );
}

function AccountTab() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSaveName = () => {
    setError(null);
    const meta = storage.read<{ users: Array<{ id: string; name: string; email: string; passwordHash: string; createdAt: string }>; businesses: unknown[] }>("meta");
    if (!meta || !user) return;
    const account = meta.users.find((u) => u.id === user.id);
    if (account) {
      account.name = name.trim() || account.name;
      storage.write("meta", meta);
      toast.success("Profile updated — refresh to see it everywhere.");
    }
  };

  const handleChangePassword = async () => {
    setError(null);
    if (newPassword.length < 8) return setError("New password must be at least 8 characters.");
    const meta = storage.read<{ users: Array<{ id: string; name: string; email: string; passwordHash: string; createdAt: string }>; businesses: unknown[] }>("meta");
    if (!meta || !user) return;
    const account = meta.users.find((u) => u.id === user.id);
    if (!account) return;
    if (account.passwordHash !== (await hashPassword(currentPassword))) {
      return setError("Your current password doesn't match.");
    }
    account.passwordHash = await hashPassword(newPassword);
    storage.write("meta", meta);
    setCurrentPassword("");
    setNewPassword("");
    toast.success("Password updated");
  };

  return (
    <div className="max-w-xl space-y-4">
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="space-y-1.5">
          <Label htmlFor="acc-name">Your name</Label>
          <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acc-email">Email</Label>
          <Input id="acc-email" value={user?.email ?? ""} disabled aria-describedby="acc-email-hint" />
          <p id="acc-email-hint" className="text-xs text-muted-foreground">
            Email changes require a connected backend and aren't available in this build.
          </p>
        </div>
        <Button onClick={handleSaveName}>Save Profile</Button>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <p className="font-display text-base font-semibold">Change password</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="acc-current">Current password</Label>
            <Input id="acc-current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-new">New password</Label>
            <Input id="acc-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
          </div>
        </div>
        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        <Button variant="outline" onClick={() => void handleChangePassword()} disabled={!currentPassword || !newPassword}>
          Update Password
        </Button>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const { business, setBusiness } = useAuth();
  if (!business) return null;
  const prefs = business.notifications;

  const update = (key: keyof typeof prefs, value: boolean) => {
    setBusiness({ ...business, notifications: { ...prefs, [key]: value } });
  };

  return (
    <div className="max-w-xl space-y-3">
      {(
        [
          { key: "followUpReminders", label: "Follow-up reminders", hint: "Nudge me about follow-ups due today and overdue ones." },
          { key: "paymentReminders", label: "Payment reminders", hint: "Tell me when payments become overdue." },
          { key: "dailySummary", label: "Daily summary", hint: "A morning snapshot of who to contact today." },
        ] as const
      ).map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div>
            <p className="text-sm font-semibold">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.hint}</p>
          </div>
          <Switch checked={prefs[item.key]} onCheckedChange={(v) => update(item.key, v)} aria-label={item.label} />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        In-app notifications are active now. Push and email delivery can be connected later.
      </p>
    </div>
  );
}

const PLANS = [
  {
    id: "free" as const,
    name: "Free",
    price: "₹0",
    period: "forever",
    features: ["Up to 50 customers", "Basic follow-ups", "Basic customer management"],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "₹299",
    period: "per month",
    features: ["Unlimited customers", "Payment tracking", "WhatsApp templates", "Advanced follow-ups", "Analytics"],
    highlight: true,
  },
  {
    id: "business" as const,
    name: "Business",
    price: "₹499",
    period: "per month",
    features: ["Multiple users", "Team management", "Advanced analytics", "Multiple branches", "Advanced automation"],
  },
];

function SubscriptionTab({ customerCount }: { customerCount: number }) {
  const { business, setBusiness } = useAuth();
  const [upgradeTo, setUpgradeTo] = useState<"pro" | "business" | null>(null);
  const currentPlan: Plan = business?.plan ?? "free";
  const planLimit = PLAN_CUSTOMER_LIMITS[currentPlan];
  const usagePercent = planLimit != null ? Math.min(100, Math.round((customerCount / planLimit) * 100)) : 0;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg font-semibold">Current plan: {PLAN_LABELS[currentPlan]}</p>
            <p className="text-sm text-muted-foreground">
              {planLimit != null
                ? `${customerCount} of ${planLimit} customers used on ${PLAN_LABELS[currentPlan]}`
                : `${customerCount} customer${customerCount === 1 ? "" : "s"} used · Unlimited customers on ${PLAN_LABELS[currentPlan]}`}
            </p>
          </div>
          <Crown className={cn("h-6 w-6", currentPlan === "free" ? "text-muted-foreground" : "text-gold-500")} aria-hidden="true" />
        </div>
        {planLimit != null ? (
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={usagePercent} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-500" style={{ width: `${usagePercent}%` }} />
            </div>
            {usagePercent >= 80 ? (
              <p className="mt-2 text-xs font-medium text-gold-800">You're close to the Free limit — Pro gives you unlimited customers.</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "flex flex-col rounded-2xl border bg-card p-5 shadow-soft",
              plan.highlight ? "border-gold-400 ring-1 ring-gold-300" : "border-border",
            )}
          >
            <div className="flex items-center gap-2">
              <p className="font-display text-lg font-semibold">{plan.name}</p>
              {plan.highlight ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-bold text-gold-800">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Popular
                </span>
              ) : null}
            </div>
            <p className="mt-2">
              <span className="font-display text-3xl font-semibold">{plan.price}</span>{" "}
              <span className="text-xs text-muted-foreground">{plan.period}</span>
            </p>
            <ul className="mt-4 flex-1 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-foreground/90">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-500" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className="mt-5"
              variant={plan.id === currentPlan ? "outline" : plan.highlight ? "default" : "outline"}
              disabled={plan.id === currentPlan || plan.id === "free"}
              onClick={() => setUpgradeTo(plan.id as "pro" | "business")}
            >
              {plan.id === currentPlan ? "Current Plan" : plan.id === "free" ? "Included" : `Upgrade to ${plan.name}`}
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={upgradeTo !== null} onOpenChange={(open) => !open && setUpgradeTo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Upgrade to {upgradeTo === "pro" ? "Pro" : "Business"}</DialogTitle>
            <DialogDescription>
              Online payments (Razorpay / Stripe) aren't wired up in this build, so card checkout isn't available yet. To
              evaluate Pro features right now, you can activate it in demo mode — clearly marked and reversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUpgradeTo(null)}>
              Maybe Later
            </Button>
            <Button
              onClick={() => {
                if (business && upgradeTo) {
                  setBusiness({ ...business, plan: upgradeTo });
                  db.setPlan(business.id, upgradeTo);
                  toast.success(`${upgradeTo === "pro" ? "Pro" : "Business"} activated (demo mode)`);
                }
                setUpgradeTo(null);
              }}
            >
              Activate in Demo Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
