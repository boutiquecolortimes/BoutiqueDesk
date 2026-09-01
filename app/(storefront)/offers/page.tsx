import { connectToDatabase } from "@/lib/db/connect";
import { Product } from "@/models/Product";
import { getSession } from "@/lib/auth/session";
import { User } from "@/models/User";
import { ProductCard, type StorefrontProduct } from "@/components/storefront/product-card";

export const metadata = { title: "Offers" };

export default async function OffersPage() {
  const session = await getSession().catch(() => null);
  let products: StorefrontProduct[] = [];
  let wishlistIds: string[] = [];

  try {
    await connectToDatabase();
    const [docs, user] = await Promise.all([
      Product.find({ status: "active", isPubliclyVisible: true, isFeatured: true })
        .populate("store", "name")
        .sort({ createdAt: -1 }),
      session ? User.findById(session.sub).select("wishlist") : null,
    ]);
    products = docs.map((p) => ({
      id: String(p._id),
      name: p.name,
      image: p.images[0],
      rentalPricePerDay: p.rentalPricePerDay,
      storeName: (p.store as unknown as { name?: string })?.name ?? "",
    }));
    wishlistIds = user?.wishlist.map((id) => String(id)) ?? [];
  } catch {
    // degrade gracefully
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">This week</p>
      <h1 className="mt-2 text-3xl font-semibold">Featured offers</h1>
      <p className="mt-2 text-sm text-muted-foreground">Hand-picked pieces our stores are highlighting right now.</p>

      {products.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">No featured offers at the moment — check back soon.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} initiallyWishlisted={wishlistIds.includes(p.id)} isLoggedIn={Boolean(session)} />
          ))}
        </div>
      )}
    </div>
  );
}
