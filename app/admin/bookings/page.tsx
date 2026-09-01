import { requireAdminSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { Booking } from "@/models/Booking";
import { Product } from "@/models/Product";
import { Store } from "@/models/Store";
import { storeScopeFilter } from "@/lib/data/scope";
import { isOwnerRole } from "@/lib/auth/roles";
import { formatCurrency, formatDate } from "@/lib/utils";
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
import { BookingDialog } from "@/components/admin/bookings/booking-dialog";
import { StatusMenu } from "@/components/admin/bookings/status-menu";
import { PaymentDialog } from "@/components/admin/bookings/payment-dialog";
import { DatabaseNotice } from "@/components/admin/database-notice";
import type { BookableProduct } from "@/components/admin/bookings/booking-items-editor";
import type { BookingStatus } from "@/lib/constants";

export const metadata = { title: "Bookings" };

const paymentVariant = { unpaid: "destructive", partial: "warning", paid: "success" } as const;

export default async function BookingsPage() {
  const session = await requireAdminSession();

  let bookings: Awaited<ReturnType<typeof Booking.find>> = [];
  let stores: { id: string; name: string }[] = [];
  let productsByStore: Record<string, BookableProduct[]> = {};

  try {
    await connectToDatabase();
    const scope = storeScopeFilter(session);
    const storeQuery = isOwnerRole(session.role) ? {} : { _id: { $in: session.storeIds } };

    const [bookingDocs, storeDocs, productDocs] = await Promise.all([
      Booking.find(scope).sort({ createdAt: -1 }).limit(100).populate("store", "name"),
      Store.find(storeQuery).sort({ name: 1 }),
      Product.find({ ...scope, status: "active" }).sort({ name: 1 }),
    ]);

    bookings = bookingDocs;
    stores = storeDocs.map((s) => ({ id: String(s._id), name: s.name }));

    productsByStore = {};
    for (const p of productDocs) {
      const storeId = String(p.store);
      if (!productsByStore[storeId]) productsByStore[storeId] = [];
      productsByStore[storeId].push({
        id: String(p._id),
        name: p.name,
        rentalPricePerDay: p.rentalPricePerDay,
        sizes: p.sizes.map((s) => ({ size: s.size, available: s.totalQuantity - s.rentedQuantity })),
      });
    }
  } catch (err) {
    return <DatabaseNotice message={err instanceof Error ? err.message : "Connection failed."} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Bookings</h1>
          <p className="text-sm text-muted-foreground">Reservations across your stores.</p>
        </div>
        {stores.length > 0 && <BookingDialog stores={stores} productsByStore={productsByStore} />}
      </div>

      <Card>
        <CardContent className="p-0">
          {bookings.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => {
                  const storeDoc = b.store as unknown as { name: string } | undefined;
                  return (
                    <TableRow key={String(b._id)}>
                      <TableCell className="font-medium">{b.bookingNumber}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{b.customer?.name}</span>
                          <span className="text-xs text-muted-foreground">{b.customer?.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{storeDoc?.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(b.startDate as unknown as string)} – {formatDate(b.endDate as unknown as string)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatCurrency(b.totalAmount)}</span>
                          <span className="text-xs text-muted-foreground">paid {formatCurrency(b.paidAmount)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={paymentVariant[b.paymentStatus as keyof typeof paymentVariant]} className="capitalize">
                          {b.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusMenu bookingId={String(b._id)} status={b.status as BookingStatus} />
                      </TableCell>
                      <TableCell className="text-right">
                        <PaymentDialog bookingId={String(b._id)} />
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
