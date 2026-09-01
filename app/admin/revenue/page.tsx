import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { getRevenueSummary } from "@/lib/data/revenue";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { RevenueChart } from "@/components/admin/revenue/revenue-chart";
import { ExportButtons, type ExportableTransaction } from "@/components/admin/revenue/export-buttons";
import { DatabaseNotice } from "@/components/admin/database-notice";
import { IndianRupee, PiggyBank, Undo2, Receipt } from "lucide-react";

export const metadata = { title: "Revenue" };

type RangeKey = "this-month" | "last-30" | "last-month" | "this-year";

function rangeFor(key: RangeKey): { from: Date; to: Date; label: string } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  switch (key) {
    case "last-30": {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      from.setHours(0, 0, 0, 0);
      return { from, to, label: "Last 30 days" };
    }
    case "last-month": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { from, to: end, label: "Last month" };
    }
    case "this-year": {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from, to, label: "This year" };
    }
    case "this-month":
    default: {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to, label: "This month" };
    }
  }
}

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "this-month", label: "This month" },
  { key: "last-month", label: "Last month" },
  { key: "last-30", label: "Last 30 days" },
  { key: "this-year", label: "This year" },
];

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await requireAdminSession();
  const { range } = await searchParams;
  const key = (RANGE_OPTIONS.some((r) => r.key === range) ? range : "this-month") as RangeKey;
  const { from, to, label } = rangeFor(key);

  let summary: Awaited<ReturnType<typeof getRevenueSummary>>;
  try {
    await connectToDatabase();
    summary = await getRevenueSummary(session, from, to);
  } catch (err) {
    return <DatabaseNotice message={err instanceof Error ? err.message : "Connection failed."} />;
  }

  const exportable: ExportableTransaction[] = summary.transactions.map((t) => ({
    id: String(t._id),
    date: (t.createdAt as unknown as Date).toISOString(),
    store: (t.store as unknown as { name?: string })?.name ?? "",
    bookingNumber: (t.booking as unknown as { bookingNumber?: string })?.bookingNumber ?? "",
    type: t.type,
    method: t.method,
    amount: t.amount,
    note: t.note ?? "",
    recordedBy: (t.recordedBy as unknown as { name?: string })?.name ?? "",
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Revenue</h1>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <div className="flex items-center gap-2">
          <nav className="flex rounded-md border border-border p-0.5">
            {RANGE_OPTIONS.map((opt) => (
              <Link
                key={opt.key}
                href={`/admin/revenue?range=${opt.key}`}
                className={cn(
                  "rounded-[5px] px-3 py-1 text-xs font-medium",
                  key === opt.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                )}
              >
                {opt.label}
              </Link>
            ))}
          </nav>
          <ExportButtons transactions={exportable} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={IndianRupee} label="Revenue" value={formatCurrency(summary.totals.revenue)} />
        <StatCard icon={PiggyBank} label="Deposits collected" value={formatCurrency(summary.totals.deposits)} />
        <StatCard icon={Undo2} label="Refunds" value={formatCurrency(summary.totals.refunds)} />
        <StatCard icon={Receipt} label="Net" value={formatCurrency(summary.totals.net)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue over time</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={summary.chart} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {summary.transactions.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No transactions in this period.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.transactions.map((t) => (
                  <TableRow key={String(t._id)}>
                    <TableCell className="text-muted-foreground">{formatDate(t.createdAt as unknown as string)}</TableCell>
                    <TableCell>{(t.store as unknown as { name?: string })?.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {(t.booking as unknown as { bookingNumber?: string })?.bookingNumber ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{t.type.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">{t.method.replace("_", " ")}</TableCell>
                    <TableCell className={cn("text-right font-medium", t.amount < 0 && "text-destructive")}>
                      {formatCurrency(t.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
