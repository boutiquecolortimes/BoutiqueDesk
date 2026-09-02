import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Boutique<span className="text-accent">Desk</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
          <Link href="/#features" className="hover:text-foreground">Features</Link>
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/login" className="hover:text-foreground">Sign in</Link>
        </nav>
        <Link href="/get-started" className={buttonVariants({ size: "sm" })}>
          Start free trial
        </Link>
      </div>
    </header>
  );
}
