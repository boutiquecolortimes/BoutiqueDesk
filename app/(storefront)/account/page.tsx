import { getSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { Booking } from "@/models/Booking";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountLogoutButton } from "@/components/storefront/account-logout-button";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const session = await getSession();
  if (!session) return null; // proxy.ts guarantees this is never reached logged out

  let bookings: Awaited<ReturnType<typeof Booking.find>> = [];
  try {
    await connectToDatabase();
    bookings = await Booking.find({ "customer.user": session.sub })
      .sort({ createdAt: -1 })
      .populate("store", "name");
  } catch {
    // degrade gracefully
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hi, {session.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">{session.email}</p>
        </div>
        <AccountLogoutButton />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your bookings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {bookings.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No bookings yet — browse the collection to make your first request.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {bookings.map((b) => (
                <li key={String(b._id)} className="flex items-center justify-between px-6 py-4 text-sm">
                  <div>
                    <p className="font-medium">{b.bookingNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {(b.store as unknown as { name?: string })?.name} ·{" "}
                      {formatDate(b.startDate as unknown as string)} – {formatDate(b.endDate as unknown as string)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{formatCurrency(b.totalAmount)}</span>
                    <Badge variant="secondary" className="capitalize">{b.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
