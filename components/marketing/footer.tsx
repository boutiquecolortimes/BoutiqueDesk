import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} BoutiqueDesk. Built for boutique rental businesses.</p>
        <div className="flex gap-5">
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/get-started" className="hover:text-foreground">Get started</Link>
          <Link href="/login" className="hover:text-foreground">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}
