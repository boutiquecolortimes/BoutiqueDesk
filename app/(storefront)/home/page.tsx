import Link from "next/link";
import { connectToDatabase } from "@/lib/db/connect";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { getSession } from "@/lib/auth/session";
import { User } from "@/models/User";
import { buttonVariants } from "@/components/ui/button";
import { ProductCard, type StorefrontProduct } from "@/components/storefront/product-card";

export const metadata = { title: "Home" };

export default async function StorefrontHomePage() {
  let featured: StorefrontProduct[] = [];
  let categories: { id: string; name: string; image?: string }[] = [];
  let wishlistIds: string[] = [];
  const session = await getSession().catch(() => null);

  try {
    await connectToDatabase();

    const [featuredDocs, categoryDocs, user] = await Promise.all([
      Product.find({ status: "active", isPubliclyVisible: true, isFeatured: true })
        .limit(8)
        .populate("store", "name")
        .sort({ createdAt: -1 }),
      Category.find({ isActive: true }).limit(6),
      session ? User.findById(session.sub).select("wishlist") : null,
    ]);

    featured = featuredDocs.map((p) => ({
      id: String(p._id),
      name: p.name,
      image: p.images[0],
      rentalPricePerDay: p.rentalPricePerDay,
      storeName: (p.store as unknown as { name?: string })?.name ?? "",
    }));
    categories = categoryDocs.map((c) => ({ id: String(c._id), name: c.name, image: c.image }));
    wishlistIds = user?.wishlist.map((id) => String(id)) ?? [];
  } catch {
    // Storefront degrades gracefully without a DB connection yet.
  }

  return (
    <div className="flex flex-col gap-16 pb-16">
      <section className="border-b border-border bg-secondary/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Rent the wardrobe you love</p>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Beautiful outfits, worn once, loved by many.
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Browse our boutique&apos;s curated rental collection — from festive wear to
            everyday statement pieces — and reserve yours in minutes.
          </p>
          <Link href="/collections" className={buttonVariants({ size: "lg", className: "mt-2" })}>
            Browse the collection
          </Link>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4">
          <h2 className="mb-4 text-lg font-semibold">Shop by category</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/collections?category=${c.id}`}
                className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 text-center text-sm font-medium hover:bg-secondary"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-6xl px-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Featured pieces</h2>
          <Link href="/collections" className="text-sm font-medium text-accent hover:underline">
            View all
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-sm text-muted-foreground">New arrivals are on their way — check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                initiallyWishlisted={wishlistIds.includes(p.id)}
                isLoggedIn={Boolean(session)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
