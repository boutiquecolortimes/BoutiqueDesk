import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Package, CalendarRange, IndianRupee } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { Store as StoreModel } from "@/models/Store";
import { Product } from "@/models/Product";
import { Booking } from "@/models/Booking";
import { Transaction } from "@/models/Transaction";
import { storeScopeFilter } from "@/lib/data/scope";
import { formatCurrency, formatDate } from "@/lib/utils";
import { isOwnerRole } from "@/lib/auth/roles";
import { DatabaseNotice } from "@/components/admin/database-notice";

export const metadata = { title: "Dashboard" };

async function loadDashboard() {
  const session = await getSession();
  if (!session) return null;

  await connectToDatabase();
  const scope = storeScopeFilter(session);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [storeCount, productCount, activeBookings, recentBookings, revenueAgg] =
    await Promise.all([
      isOwnerRole(session.role) ? StoreModel.countDocuments({ organization: session.orgId }) : null,
      Product.countDocuments(scope),
      Booking.countDocuments({ ...scope, status: { $in: ["reserved", "active", "overdue"] } }),
      Booking.find(scope).sort({ createdAt: -1 }).limit(6).populate("store", "name").lean(),
      Transaction.aggregate([
        {
          $match: {
            ...scope,
            createdAt: { $gte: startOfMonth },
            type: { $in: ["booking_payment", "deposit"] },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

  return {
    session,
    storeCount,
    productCount,
    activeBookings,
    recentBookings,
    revenueThisMonth: revenueAgg[0]?.total ?? 0,
  };
}

export default async function AdminDashboardPage() {
  let data: Awaited<ReturnType<typeof loadDashboard>> = null;
  let dbError: string | null = null;

  try {
    data = await loadDashboard();
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Could not connect to the database.";
  }

  if (dbError) return <DatabaseNotice message={dbError} />;
  if (!data) return null;

  const { session, storeCount, productCount, activeBookings, recentBookings, revenueThisMonth } =
    data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Welcome back, {session.name.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your boutique.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {storeCount !== null && (
          <StatCard icon={Store} label="Stores" value={storeCount.toString()} />
        )}
        <StatCard icon={Package} label="Inventory items" value={productCount.toString()} />
        <StatCard icon={CalendarRange} label="Active bookings" value={activeBookings.toString()} />
        <StatCard
          icon={IndianRupee}
          label="Revenue this month"
          value={formatCurrency(revenueThisMonth)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent bookings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentBookings.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentBookings.map((b) => (
                <li key={String(b._id)} className="flex items-center justify-between px-6 py-3 text-sm">
                  <div>
                    <p className="font-medium">{b.bookingNumber} — {b.customer?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(b.store as unknown as { name?: string })?.name ?? "Store"} · {formatDate(b.startDate as unknown as string)}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize text-secondary-foreground">
                    {b.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
