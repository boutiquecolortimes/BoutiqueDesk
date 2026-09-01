"use client";

import * as React from "react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BookingItemsEditor, type BookableProduct } from "./booking-items-editor";
import { createBooking, type BookingActionState } from "@/lib/actions/bookings";
import { daysBetween, formatCurrency } from "@/lib/utils";

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function BookingDialog({
  stores,
  productsByStore,
}: {
  stores: { id: string; name: string }[];
  productsByStore: Record<string, BookableProduct[]>;
}) {
  const [open, setOpen] = useState(false);
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO(2));
  const [rentalAmount, setRentalAmount] = useState(0);
  const [state, formAction, pending] = useActionState<BookingActionState, FormData>(createBooking, {});

  const days = daysBetween(startDate, endDate);
  const products = productsByStore[storeId] ?? [];

  useEffect(() => {
    if (state.success) {
      toast.success("Booking created.");
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        <Plus className="size-4" /> New booking
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="storeId" value={storeId} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {stores.length > 1 && (
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block">Store</Label>
                <Select value={storeId} onValueChange={(v) => setStoreId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="customerName" className="mb-1.5 block">Customer name</Label>
              <Input id="customerName" name="customerName" required />
            </div>
            <div>
              <Label htmlFor="customerPhone" className="mb-1.5 block">Phone</Label>
              <Input id="customerPhone" name="customerPhone" required />
            </div>
            <div>
              <Label htmlFor="customerEmail" className="mb-1.5 block">Email (optional)</Label>
              <Input id="customerEmail" name="customerEmail" type="email" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="startDate" className="mb-1.5 block">From</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="mb-1.5 block">To</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Items ({days} day{days > 1 ? "s" : ""})</Label>
            <BookingItemsEditor products={products} days={days} onRentalAmountChange={setRentalAmount} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="depositAmount" className="mb-1.5 block">Security deposit (₹, optional override)</Label>
              <Input id="depositAmount" name="depositAmount" type="number" min={0} placeholder="Auto-calculated from items" />
            </div>
            <div>
              <Label htmlFor="notes" className="mb-1.5 block">Notes</Label>
              <Textarea id="notes" name="notes" rows={1} />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">Rental total: {formatCurrency(rentalAmount)} · deposit added separately</p>

          <DialogFooter>
            <DialogClose className="inline-flex h-9 items-center justify-center rounded-md border border-input px-4 text-sm">
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending || products.length === 0}>
              {pending ? "Creating…" : "Create booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
