import { getSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { ProductCard, type StorefrontProduct } from "@/components/storefront/product-card";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const session = await getSession();
  if (!session) return null;

  let products: StorefrontProduct[] = [];
  try {
    await connectToDatabase();
    const user = await User.findById(session.sub).select("wishlist");
    const docs = await Product.find({
      _id: { $in: user?.wishlist ?? [] },
      organization: session.orgId,
    }).populate("store", "name");
    products = docs.map((p) => ({
      id: String(p._id),
      name: p.name,
      image: p.images[0],
      rentalPricePerDay: p.rentalPricePerDay,
      storeName: (p.store as unknown as { name?: string })?.name ?? "",
    }));
  } catch {
    // degrade gracefully
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Your wishlist</h1>
      {products.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nothing saved yet — tap the heart on any item to add it here.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} initiallyWishlisted isLoggedIn />
          ))}
        </div>
      )}
    </div>
  );
}
