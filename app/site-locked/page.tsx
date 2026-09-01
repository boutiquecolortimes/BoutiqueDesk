import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function SiteLockedPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-accent">BoutiqueDesk</p>
      <h1 className="text-2xl font-semibold">We&apos;re getting things ready</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Our storefront is being rebuilt. Staff and store owners can still sign in below —
        everyone else, please check back soon.
      </p>
      <Link href="/login" className={buttonVariants({ variant: "default" })}>
        Staff login
      </Link>
    </main>
  );
}
