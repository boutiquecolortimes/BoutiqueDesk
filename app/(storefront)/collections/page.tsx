import Link from "next/link";
import { connectToDatabase } from "@/lib/db/connect";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { getCurrentOrg } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import { ProductCard, type StorefrontProduct } from "@/components/storefront/product-card";
import { DatabaseNotice } from "@/components/admin/database-notice";

export const metadata = { title: "Collections" };

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const session = await getSession().catch(() => null);

  let products: StorefrontProduct[] = [];
  let categories: { id: string; name: string }[] = [];
  let wishlistIds: string[] = [];

  try {
    await connectToDatabase();
    const org = await getCurrentOrg();
    const query: Record<string, unknown> = {
      organization: org?._id ?? null,
      status: "active",
      isPubliclyVisible: true,
    };
    if (category) query.category = category;

    const [productDocs, categoryDocs, user] = await Promise.all([
      org ? Product.find(query).populate("store", "name").sort({ createdAt: -1 }).limit(60) : [],
      org ? Category.find({ organization: org._id, isActive: true }).sort({ name: 1 }) : [],
      session ? User.findById(session.sub).select("wishlist") : null,
    ]);

    products = productDocs.map((p) => ({
      id: String(p._id),
      name: p.name,
      image: p.images[0],
      rentalPricePerDay: p.rentalPricePerDay,
      storeName: (p.store as unknown as { name?: string })?.name ?? "",
    }));
    categories = categoryDocs.map((c) => ({ id: String(c._id), name: c.name }));
    wishlistIds = user?.wishlist.map((id) => String(id)) ?? [];
  } catch (err) {
    return <DatabaseNotice message={err instanceof Error ? err.message : "Connection failed."} />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Collections</h1>
      <p className="mt-1 text-sm text-muted-foreground">Everything available to rent, right now.</p>

      {categories.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/collections"
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              !category ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-secondary"
            )}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/collections?category=${c.id}`}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                category === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-secondary"
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">Nothing here yet — check back soon.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              initiallyWishlisted={wishlistIds.includes(p.id)}
              isLoggedIn={Boolean(session)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
