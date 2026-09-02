import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db/connect";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { getCurrentOrg } from "@/lib/tenant";
import { formatCurrency } from "@/lib/utils";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { BookingRequestForm } from "@/components/storefront/booking-request-form";
import { WishlistButton } from "@/components/storefront/wishlist-button";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await connectToDatabase();
  const org = await getCurrentOrg();
  if (!org) notFound();
  const product = await Product.findOne({
    _id: id,
    organization: org._id,
    isPubliclyVisible: true,
  }).populate("store", "name");
  if (!product) notFound();

  const session = await getSession().catch(() => null);
  const user = session ? await User.findById(session.sub).select("wishlist") : null;
  const wishlisted = user?.wishlist.some((w) => String(w) === id) ?? false;

  const storeDoc = product.store as unknown as { _id: string; name: string };
  const sizes = product.sizes.map((s) => ({ size: s.size, available: s.totalQuantity - s.rentedQuantity }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{storeDoc?.name}</p>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <p className="mt-1 text-xl font-semibold text-accent">
              {formatCurrency(product.rentalPricePerDay)} <span className="text-sm font-normal text-muted-foreground">/ day</span>
            </p>
            {product.securityDeposit > 0 && (
              <p className="text-xs text-muted-foreground">
                + {formatCurrency(product.securityDeposit)} refundable security deposit
              </p>
            )}
          </div>

          {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}

          <WishlistButton productId={id} initiallyWishlisted={wishlisted} isLoggedIn={Boolean(session)} />

          <BookingRequestForm
            storeId={String(storeDoc?._id)}
            productId={id}
            productName={product.name}
            rentalPricePerDay={product.rentalPricePerDay}
            sizes={sizes}
          />
        </div>
      </div>
    </div>
  );
}
