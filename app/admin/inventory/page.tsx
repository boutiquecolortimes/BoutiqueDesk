import Image from "next/image";
import { requireAdminSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Store } from "@/models/Store";
import { storeScopeFilter } from "@/lib/data/scope";
import { isOwnerRole } from "@/lib/auth/roles";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ProductDialog } from "@/components/admin/inventory/product-dialog";
import { ArchiveButton } from "@/components/admin/inventory/archive-button";
import { DatabaseNotice } from "@/components/admin/database-notice";
import { Package } from "lucide-react";

export const metadata = { title: "Inventory" };

const statusVariant = {
  active: "success",
  maintenance: "warning",
  retired: "secondary",
} as const;

export default async function InventoryPage() {
  const session = await requireAdminSession();

  let products: Awaited<ReturnType<typeof Product.find>> = [];
  let stores: { id: string; name: string }[] = [];
  let categories: { id: string; name: string }[] = [];

  try {
    await connectToDatabase();
    const scope = storeScopeFilter(session);
    const storeQuery = isOwnerRole(session.role)
      ? { organization: session.orgId }
      : { _id: { $in: session.storeIds }, organization: session.orgId };

    const [productDocs, storeDocs, categoryDocs] = await Promise.all([
      Product.find(scope).sort({ createdAt: -1 }).populate("store", "name").populate("category", "name"),
      Store.find(storeQuery).sort({ name: 1 }),
      Category.find({ organization: session.orgId }).sort({ name: 1 }),
    ]);

    products = productDocs;
    stores = storeDocs.map((s) => ({ id: String(s._id), name: s.name }));
    categories = categoryDocs.map((c) => ({ id: String(c._id), name: c.name }));
  } catch (err) {
    return <DatabaseNotice message={err instanceof Error ? err.message : "Connection failed."} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground">Every rentable item, across your stores.</p>
        </div>
        {stores.length > 0 && (
          <ProductDialog action={createProduct} mode="create" stores={stores} categories={categories} />
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {stores.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No store assigned yet — ask an owner to add you to a store.
            </p>
          ) : products.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No inventory yet — add your first item.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price/day</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const total = product.sizes.reduce((sum, s) => sum + s.totalQuantity, 0);
                  const available = product.sizes.reduce(
                    (sum, s) => sum + (s.totalQuantity - s.rentedQuantity),
                    0
                  );
                  const storeDoc = product.store as unknown as { _id: string; name: string };
                  const categoryDoc = product.category as unknown as { name: string } | undefined;
                  return (
                    <TableRow key={String(product._id)}>
                      <TableCell>
                        <div className="flex size-10 items-center justify-center overflow-hidden rounded-md bg-muted">
                          {product.images[0] ? (
                            <Image src={product.images[0]} alt="" width={40} height={40} className="size-10 object-cover" />
                          ) : (
                            <Package className="size-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{storeDoc?.name}</TableCell>
                      <TableCell className="text-muted-foreground">{categoryDoc?.name ?? "—"}</TableCell>
                      <TableCell>{formatCurrency(product.rentalPricePerDay)}</TableCell>
                      <TableCell>
                        {available}/{total}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[product.status as keyof typeof statusVariant]} className="capitalize">
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex items-center justify-end gap-1 text-right">
                        <ProductDialog
                          mode="edit"
                          action={updateProduct.bind(null, String(product._id))}
                          stores={stores}
                          categories={categories}
                          initial={{
                            name: product.name,
                            storeId: String(storeDoc?._id ?? ""),
                            categoryId: product.category ? String((product.category as unknown as { _id: string })._id) : "",
                            sku: product.sku ?? "",
                            description: product.description ?? "",
                            rentalPricePerDay: String(product.rentalPricePerDay),
                            securityDeposit: String(product.securityDeposit),
                            purchasePrice: product.purchasePrice ? String(product.purchasePrice) : "",
                            status: product.status as "active" | "maintenance" | "retired",
                            isPubliclyVisible: product.isPubliclyVisible,
                            isFeatured: product.isFeatured,
                            sizes: product.sizes.map((s) => ({ size: s.size, totalQuantity: s.totalQuantity })),
                            images: product.images,
                          }}
                        />
                        {product.status !== "retired" && (
                          <ArchiveButton productId={String(product._id)} />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
