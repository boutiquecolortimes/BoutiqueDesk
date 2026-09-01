import "server-only";
import { Transaction } from "@/models/Transaction";
import type { AccessTokenPayload } from "@/lib/auth/tokens";
import { storeScopeFilter } from "./scope";

export interface RevenuePoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  deposits: number;
  refunds: number;
}

export async function getRevenueSummary(
  session: AccessTokenPayload,
  from: Date,
  to: Date
) {
  const scope = storeScopeFilter(session);
  const match = { ...scope, createdAt: { $gte: from, $lte: to } };

  const [byDay, totals, transactions] = await Promise.all([
    Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: "$type",
          },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]),
    Transaction.aggregate([
      { $match: match },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
    Transaction.find(match)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("store", "name")
      .populate("booking", "bookingNumber")
      .populate("recordedBy", "name"),
  ]);

  const pointsByDate = new Map<string, RevenuePoint>();
  for (const row of byDay) {
    const date = row._id.date as string;
    const type = row._id.type as string;
    if (!pointsByDate.has(date)) {
      pointsByDate.set(date, { date, revenue: 0, deposits: 0, refunds: 0 });
    }
    const point = pointsByDate.get(date)!;
    if (type === "booking_payment") point.revenue += row.amount;
    else if (type === "deposit") point.deposits += row.amount;
    else if (type === "refund" || type === "deposit_refund") point.refunds += Math.abs(row.amount);
  }

  const totalsByType = Object.fromEntries(totals.map((t) => [t._id, t.total])) as Record<
    string,
    number
  >;

  return {
    chart: Array.from(pointsByDate.values()).sort((a, b) => a.date.localeCompare(b.date)),
    totals: {
      revenue: totalsByType.booking_payment ?? 0,
      deposits: totalsByType.deposit ?? 0,
      refunds: Math.abs((totalsByType.refund ?? 0) + (totalsByType.deposit_refund ?? 0)),
      expenses: Math.abs(totalsByType.expense ?? 0),
      net:
        (totalsByType.booking_payment ?? 0) +
        (totalsByType.deposit ?? 0) +
        (totalsByType.refund ?? 0) +
        (totalsByType.deposit_refund ?? 0) +
        (totalsByType.expense ?? 0) +
        (totalsByType.adjustment ?? 0),
    },
    transactions,
  };
}
