"use client";

import * as React from "react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestBooking, type BookingRequestState } from "@/lib/actions/public";
import { daysBetween, formatCurrency } from "@/lib/utils";

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function BookingRequestForm({
  storeId,
  productId,
  productName,
  rentalPricePerDay,
  sizes,
}: {
  storeId: string;
  productId: string;
  productName: string;
  rentalPricePerDay: number;
  sizes: { size: string; available: number }[];
}) {
  const [size, setSize] = useState(sizes.find((s) => s.available > 0)?.size ?? sizes[0]?.size ?? "");
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO(2));
  const [state, formAction, pending] = useActionState<BookingRequestState, FormData>(requestBooking, {});

  const days = daysBetween(startDate, endDate);
  const total = rentalPricePerDay * quantity * days;

  const itemsJson = useMemo(
    () => JSON.stringify([{ productId, size, quantity }]),
    [productId, size, quantity]
  );

  useEffect(() => {
    if (state.success) {
      toast.success(`Request sent! Your booking number is ${state.bookingNumber}.`, {
        description: "We'll confirm availability and reach out shortly.",
      });
    } else if (state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (state.success) {
    return (
      <div className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm">
        <p className="font-medium text-success">Request sent for {productName}!</p>
        <p className="mt-1 text-muted-foreground">
          Booking reference <span className="font-mono font-medium">{state.bookingNumber}</span>. Save it — you can
          use it to track your order.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="itemsJson" value={itemsJson} />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="mb-1.5 block text-xs">Size</Label>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            {sizes.map((s) => (
              <option key={s.size} value={s.size} disabled={s.available <= 0}>
                {s.size} {s.available <= 0 ? "(out of stock)" : `(${s.available} left)`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Quantity</Label>
          <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">From</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={todayISO()} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">To</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />
        </div>
      </div>
      <input type="hidden" name="startDate" value={startDate} />
      <input type="hidden" name="endDate" value={endDate} />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Input name="customerName" placeholder="Your name" required className="sm:col-span-1" />
        <Input name="customerPhone" placeholder="Phone number" required className="sm:col-span-1" />
        <Input name="customerEmail" type="email" placeholder="Email (optional)" className="sm:col-span-1" />
      </div>

      <p className="text-sm text-muted-foreground">
        {days} day{days > 1 ? "s" : ""} · Est. rental {formatCurrency(total)} + refundable deposit
      </p>

      <Button type="submit" disabled={pending || !size}>
        {pending ? "Sending request…" : "Request to book"}
      </Button>
      <p className="text-xs text-muted-foreground">
        This reserves your item — our team will confirm and collect the deposit before pickup.
      </p>
    </form>
  );
}
