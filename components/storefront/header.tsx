import Link from "next/link";
import { Heart, User } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { STOREFRONT_NAV_LINKS } from "./nav-links";
import { MobileMenu } from "./mobile-menu";

export async function StorefrontHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <MobileMenu />
          <Link href="/home" className="text-lg font-semibold tracking-tight">
            BoutiqueDesk
          </Link>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {STOREFRONT_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/wishlist" className="text-muted-foreground hover:text-foreground">
            <Heart className="size-5" />
            <span className="sr-only">Wishlist</span>
          </Link>
          <Link
            href={session ? "/account" : "/login"}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <User className="size-5" />
            <span className="hidden sm:inline">{session ? session.name.split(" ")[0] : "Sign in"}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
