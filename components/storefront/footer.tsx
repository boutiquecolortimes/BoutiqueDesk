import Link from "next/link";

export function StorefrontFooter() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-10 text-sm sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <p className="text-base font-semibold">BoutiqueDesk</p>
          <p className="mt-2 text-muted-foreground">Rent beautifully, wear once, love always.</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-medium">Shop</p>
          <Link href="/collections" className="text-muted-foreground hover:text-foreground">Collections</Link>
          <Link href="/offers" className="text-muted-foreground hover:text-foreground">Offers</Link>
          <Link href="/gallery" className="text-muted-foreground hover:text-foreground">Gallery</Link>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-medium">Support</p>
          <Link href="/faq" className="text-muted-foreground hover:text-foreground">FAQ</Link>
          <Link href="/order-tracking" className="text-muted-foreground hover:text-foreground">Track order</Link>
          <Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact us</Link>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-medium">Company</p>
          <Link href="/about" className="text-muted-foreground hover:text-foreground">About</Link>
          <Link href="/testimonials" className="text-muted-foreground hover:text-foreground">Testimonials</Link>
          <Link href="/blog" className="text-muted-foreground hover:text-foreground">Blog</Link>
          <Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground">Privacy policy</Link>
          <Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BoutiqueDesk. All rights reserved.
      </div>
    </footer>
  );
}
