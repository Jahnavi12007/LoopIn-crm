import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Check,
  ChevronDown,
  Clock,
  History,
  MessageSquareText,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { LogoMark } from "@/components/layout/Sidebar";

const FEATURES = [
  { icon: Users, title: "Customer Management", text: "Every customer with phone, tags, notes and history — searchable in seconds." },
  { icon: BellRing, title: "Smart Follow-ups", text: "Know who to contact today, why, and what to say. Recurring follow-ups included." },
  { icon: Wallet, title: "Payment Tracking", text: "See what's billed, paid and pending. Balances update as you record payments." },
  { icon: MessageSquareText, title: "WhatsApp Templates", text: "Reusable messages with smart placeholders — personalized for every customer." },
  { icon: History, title: "Activity Timeline", text: "Every call, message, note and payment in one customer history." },
  { icon: BarChart3, title: "Simple Analytics", text: "No vanity metrics. Just whether your customer management is improving." },
];

const STEPS = [
  { title: "Add your customers", text: "Name and phone is enough. Import from your notebook or sheets as you go." },
  { title: "Schedule follow-ups", text: "Payment reminders, enquiries, appointments — with dates, times and priorities." },
  { title: "Contact on WhatsApp", text: "One tap opens WhatsApp with a ready, personalized message." },
  { title: "Track payments", text: "Record what you collect and always know who owes what." },
  { title: "Build relationships", text: "Never forget a customer — and watch repeat business grow." },
];

const FAQS = [
  {
    q: "Do I need the WhatsApp Business API?",
    a: "No. Nudge opens WhatsApp with your message pre-filled — you press send. When you're ready for the official API later, Nudge is built to add it without changing how you work.",
  },
  {
    q: "Is my customer data safe?",
    a: "Your workspace is private to your business, and data isolation is enforced at every layer. Your customer lists are never shared or exposed to other accounts.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes — Nudge is mobile-first. Today's follow-ups, WhatsApp, calling, adding customers and recording payments are all one tap away on your phone.",
  },
  {
    q: "What does the Free plan include?",
    a: "Up to 50 customers, follow-ups and basic customer management — free forever. Pro (₹299/mo) adds unlimited customers, payment tracking, templates and analytics.",
  },
  {
    q: "Do I need training to use it?",
    a: "If you can use WhatsApp, you can use Nudge. The dashboard shows exactly who to contact today and what to do next — no training needed.",
  },
];

const PRICING = [
  { name: "Free", price: "₹0", period: "forever", features: ["Up to 50 customers", "Basic follow-ups", "Basic customer management"], cta: "Start Free" },
  { name: "Pro", price: "₹299", period: "per month", features: ["Unlimited customers", "Payment tracking", "WhatsApp templates", "Advanced follow-ups", "Analytics"], highlight: true },
  { name: "Business", price: "₹499", period: "per month", features: ["Multiple users", "Team management", "Advanced analytics", "Multiple branches", "Advanced automation"] },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <span className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-xl font-semibold tracking-tight">Nudge</span>
          </span>
          <nav aria-label="Landing" className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Start Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(44_62%_92%)_0%,transparent_70%)]"
          />
          <div className="container relative flex flex-col items-center py-16 text-center sm:py-24">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-300 bg-gold-50 px-4 py-1.5 text-xs font-semibold text-gold-800">
              <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
              The WhatsApp CRM for small businesses
            </p>
            <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-forest-950 sm:text-6xl">
              Never forget a customer again.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Manage customers, follow-ups, payments, and WhatsApp conversations from one simple workspace built for
              small businesses.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link to="/signup">
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <a href="#how">See How It Works</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Free forever for up to 50 customers · No credit card needed</p>

            {/* Product mock */}
            <div className="mt-14 w-full max-w-2xl">
              <HeroMock />
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="border-y border-border bg-forest-950 py-16 text-white sm:py-20" aria-labelledby="problem-heading">
          <div className="container max-w-3xl text-center">
            <h2 id="problem-heading" className="font-display text-2xl font-semibold sm:text-3xl">
              Sound familiar?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/75">
              Customer details are scattered across WhatsApp, notebooks, spreadsheets, and memory. Follow-ups slip,
              payments get forgotten, and regular customers drift away — not because you don't care, but because
              nothing reminds you.
            </p>
            <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
              {["A payment you forgot to chase", "An enquiry you never replied to", "A regular who never came back"].map((item) => (
                <div key={item} className="rounded-2xl bg-white/5 p-4 text-sm text-white/80 ring-1 ring-white/10">
                  <Clock className="mb-2 h-4 w-4 text-gold-300" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution */}
        <section className="py-16 sm:py-20" aria-labelledby="solution-heading">
          <div className="container max-w-3xl text-center">
            <h2 id="solution-heading" className="font-display text-2xl font-semibold tracking-tight text-forest-950 sm:text-3xl">
              One simple workspace
            </h2>
            <p className="mt-4 text-muted-foreground">
              Customer → Conversation → Follow-up → Payment → Repeat business.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Users, label: "Customers" },
                { icon: BellRing, label: "Follow-ups" },
                { icon: Wallet, label: "Payments" },
                { icon: null, label: "WhatsApp" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                    {Icon ? <Icon className="h-5 w-5" aria-hidden="true" /> : <WhatsAppIcon className="h-5 w-5" />}
                  </span>
                  <p className="mt-3 text-sm font-semibold">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 bg-cream-100/60 py-16 sm:py-20" aria-labelledby="how-heading">
          <div className="container">
            <h2 id="how-heading" className="text-center font-display text-2xl font-semibold tracking-tight text-forest-950 sm:text-3xl">
              How it works
            </h2>
            <ol className="mx-auto mt-10 max-w-2xl space-y-4">
              {STEPS.map((step, idx) => (
                <li key={step.title} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-700 font-display text-sm font-semibold text-gold-300">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{step.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 py-16 sm:py-20" aria-labelledby="features-heading">
          <div className="container">
            <h2 id="features-heading" className="text-center font-display text-2xl font-semibold tracking-tight text-forest-950 sm:text-3xl">
              Everything you need. Nothing you don't.
            </h2>
            <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="card-lift rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 bg-cream-100/60 py-16 sm:py-20" aria-labelledby="pricing-heading">
          <div className="container">
            <h2 id="pricing-heading" className="text-center font-display text-2xl font-semibold tracking-tight text-forest-950 sm:text-3xl">
              Simple pricing
            </h2>
            <p className="mt-3 text-center text-muted-foreground">Start free. Upgrade when your business grows.</p>
            <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-3">
              {PRICING.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex flex-col rounded-3xl border bg-card p-6 shadow-soft ${plan.highlight ? "border-gold-400 ring-2 ring-gold-300/60" : "border-border"}`}
                >
                  {plan.highlight ? (
                    <span className="mb-3 inline-flex w-fit items-center rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-bold text-gold-800">
                      Most Popular
                    </span>
                  ) : null}
                  <p className="font-display text-lg font-semibold">{plan.name}</p>
                  <p className="mt-2">
                    <span className="font-display text-4xl font-semibold">{plan.price}</span>{" "}
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-6" variant={plan.highlight ? "default" : "outline"} asChild>
                    <Link to="/signup">{plan.cta ?? `Choose ${plan.name}`}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 py-16 sm:py-20" aria-labelledby="faq-heading">
          <div className="container max-w-2xl">
            <h2 id="faq-heading" className="text-center font-display text-2xl font-semibold tracking-tight text-forest-950 sm:text-3xl">
              Frequently asked questions
            </h2>
            <Accordion type="single" collapsible className="mt-8">
              {FAQS.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q}>
                  <AccordionTrigger className="text-left font-semibold">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="pb-20">
          <div className="container">
            <div className="mx-auto max-w-3xl rounded-3xl bg-forest-800 px-6 py-12 text-center text-white sm:px-12">
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">Your customers are waiting.</h2>
              <p className="mx-auto mt-3 max-w-md text-white/75">
                Set up your workspace in under a minute and never miss a follow-up again.
              </p>
              <Button size="lg" className="mt-7 h-12 bg-gold-400 px-8 text-base text-forest-950 hover:bg-gold-300" asChild>
                <Link to="/signup">
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <LogoMark className="h-6 w-6" />
            © {new Date().getFullYear()} Nudge — WhatsApp CRM for small businesses
          </span>
          <div className="flex gap-5 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <Link to="/login" className="hover:text-foreground">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Static product mock rendered with real UI primitives — no screenshot needed. */
function HeroMock() {
  return (
    <div className="relative rounded-3xl border border-border bg-card p-4 text-left shadow-lifted sm:p-5">
      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <p className="font-display text-sm font-semibold">Today's Follow-ups</p>
        <p className="rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-bold text-gold-800">3 due</p>
      </div>
      <div className="mt-3 space-y-2.5">
        {[
          { name: "Ravi Kumar", reason: "Payment follow-up · ₹4,500 pending", time: "Today · 10:00 AM" },
          { name: "Priya Sharma", reason: "Appointment reminder", time: "Today · 12:30 PM" },
          { name: "Rahul Verma", reason: "Enquiry follow-up", time: "Today · 5:00 PM" },
        ].map((row) => (
          <div key={row.name} className="flex items-center gap-3 rounded-xl border border-border/70 bg-cream-50/70 px-3.5 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-100 text-xs font-bold text-forest-800">
              {row.name.split(" ").map((p) => p[0]).join("")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{row.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{row.reason}</span>
            </span>
            <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
              <span className="flex h-8 items-center rounded-full bg-forest-700 px-3 text-[11px] font-semibold text-white">
                <WhatsAppIcon className="mr-1 h-3 w-3" />
                WhatsApp
              </span>
              <span className="flex h-8 items-center rounded-full border border-forest-300 px-3 text-[11px] font-semibold text-forest-700">
                <Check className="mr-1 h-3 w-3" aria-hidden="true" />
                Complete
              </span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <ChevronDown className="h-3 w-3" aria-hidden="true" />
        Real dashboard, real actions — not a screenshot
      </p>
    </div>
  );
}
