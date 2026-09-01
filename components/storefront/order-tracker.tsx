"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trackOrder } from "@/lib/actions/public";
import { formatCurrency, formatDate } from "@/lib/utils";

type TrackResult = Awaited<ReturnType<typeof trackOrder>>;

async function action(_prev: TrackResult, formData: FormData): Promise<TrackResult> {
  return trackOrder(formData);
}

export function OrderTracker() {
  const [result, formAction, pending] = useActionState<TrackResult, FormData>(action, null);

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="bookingNumber" className="mb-1.5 block text-xs">Booking number</Label>
          <Input id="bookingNumber" name="bookingNumber" placeholder="e.g. STOR-00012" required />
        </div>
        <div className="flex-1">
          <Label htmlFor="phone" className="mb-1.5 block text-xs">Phone number used at booking</Label>
          <Input id="phone" name="phone" required />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Searching…" : "Track order"}
        </Button>
      </form>

      {result === null ? null : result ? (
        <div className="rounded-lg border border-border p-5">
          <div className="flex items-center justify-between">
            <p className="font-medium">{result.bookingNumber}</p>
            <Badge variant="secondary" className="capitalize">{result.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{result.store}</p>
          <p className="mt-3 text-sm">
            {formatDate(result.startDate as unknown as string)} – {formatDate(result.endDate as unknown as string)}
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
            {result.items.map((item, i) => (
              <li key={i}>{item.name} ({item.size}) × {item.quantity}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            Total {formatCurrency(result.totalAmount)} · Paid {formatCurrency(result.paidAmount)}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find a booking with that number and phone combination.
        </p>
      )}
    </div>
  );
}
