import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Store,
  CalendarCheck,
  Users,
  LineChart,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";
import { getCurrentOrg } from "@/lib/tenant";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";

const FEATURES = [
  {
    icon: Store,
    title: "Multi-store inventory",
    description:
      "Every location's stock, sizes, and pricing in one place — add a new branch in minutes, not weeks.",
  },
  {
    icon: CalendarCheck,
    title: "Overbooking-safe bookings",
    description:
      "Reservations lock stock atomically the moment they're made, so two customers can never book the same piece.",
  },
  {
    icon: Users,
    title: "Staff & roles",
    description:
      "Owners see everything; staff see only their assigned store. Invite your team with the right access from day one.",
  },
  {
    icon: LineChart,
    title: "Revenue reporting",
    description:
      "Per-store and combined revenue, outstanding deposits, and exportable PDF/CSV reports — no spreadsheets required.",
  },
  {
    icon: ShoppingBag,
    title: "Your own storefront",
    description:
      "A public, on-brand site for customers to browse, wishlist, and request bookings — included, not bolted on.",
  },
  {
    icon: ShieldCheck,
    title: "Your data, isolated",
    description:
      "Every boutique on BoutiqueDesk runs in its own fully isolated workspace — nobody else ever sees your data.",
  },
];

export default async function MarketingHomePage() {
  // Tenant subdomain visitors never see the sales pitch — straight to their storefront.
  const org = await getCurrentOrg();
  if (org) {
    redirect("/home");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingHeader />
      <section className="border-b border-border bg-secondary/30">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 py-24 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            The rental management system for boutiques
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Run every store, booking, and rupee — from one dashboard.
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Inventory, bookings, staff, revenue, and a customer-facing storefront — the
            complete boutique rental ERP, ready in minutes, not months.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/get-started" className={buttonVariants({ size: "lg" })}>
              Start your free trial
            </Link>
            <Link href="/pricing" className={buttonVariants({ size: "lg", variant: "outline" })}>
              See pricing
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">Free for 1 day. No card required.</p>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold">Everything a boutique rental business needs</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Built for real day-to-day operations, not a generic point-of-sale.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <f.icon className="mb-2 size-6 text-accent" />
                <CardTitle className="text-base">{f.title}</CardTitle>
                <CardDescription>{f.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold">Ready to run your boutique on BoutiqueDesk?</h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            Set up your business in under two minutes. Try every feature free for a day, then
            pick the plan that fits.
          </p>
          <Link href="/get-started" className={buttonVariants({ size: "lg" })}>
            Start your free trial
          </Link>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}
