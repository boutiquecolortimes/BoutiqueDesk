import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata = { title: "Pricing" };

// Placeholder figures — swap these for real numbers once billing is wired up.
// Everything else on this page reads from here, so it's a one-line edit.
const PRICING = {
  rent: { monthly: 1999 },
  buy: { oneTime: 49999, maintenanceMonthly: 999 },
};

const PLANS = [
  {
    name: "Free trial",
    price: "Free",
    period: "for 1 day",
    description: "Every feature, unlocked, to try with your own inventory.",
    features: [
      "Full admin ERP access",
      "Your own storefront subdomain",
      "Unlimited stores & staff",
      "No card required",
    ],
    cta: { label: "Start free trial", href: "/get-started" },
    highlight: false,
  },
  {
    name: "Rent",
    price: formatCurrency(PRICING.rent.monthly),
    period: "/ month",
    description: "Shared hosting under your own BoutiqueDesk subdomain — lowest cost to run.",
    features: [
      "Everything in the trial",
      "yourboutique.boutiquedesk subdomain",
      "Automatic updates & backups",
      "Cancel anytime",
    ],
    cta: { label: "Choose Rent", href: "/get-started" },
    highlight: true,
  },
  {
    name: "Buy",
    price: formatCurrency(PRICING.buy.oneTime),
    period: `one-time + ${formatCurrency(PRICING.buy.maintenanceMonthly)}/mo maintenance`,
    description: "Dedicated hosting on your own custom domain — fully yours.",
    features: [
      "Everything in Rent",
      "Your own custom domain",
      "Dedicated hosting & database",
      "Priority support",
    ],
    cta: { label: "Talk to us", href: "/get-started" },
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingHeader />
      <div className="mx-auto w-full max-w-6xl px-4 py-20">
      <div className="mb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Pricing</p>
        <h1 className="mt-2 text-3xl font-semibold">Simple pricing, no surprises</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Start free. Move to Rent for the lowest ongoing cost, or Buy for your own dedicated,
          custom-domain setup.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn(plan.highlight && "border-accent shadow-md ring-1 ring-accent/30")}
          >
            <CardHeader>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-semibold">{plan.price}</span>
                <span className="text-xs text-muted-foreground">{plan.period}</span>
              </div>
              <CardDescription className="mt-2">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ul className="flex flex-col gap-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.cta.href}
                className={buttonVariants({ variant: plan.highlight ? "default" : "outline", className: "mt-2" })}
              >
                {plan.cta.label}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Prices shown are indicative and may change. Taxes may apply.
      </p>
      </div>
      <MarketingFooter />
    </div>
  );
}
