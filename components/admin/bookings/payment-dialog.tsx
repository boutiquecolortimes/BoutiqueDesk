"use client";

import * as React from "react";
import { useActionState, useEffect, useState } from "react";
import { IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { recordBookingPayment, type PaymentActionState } from "@/lib/actions/bookings";
import { TRANSACTION_TYPES, PAYMENT_METHODS } from "@/lib/constants";

const typeLabels: Record<(typeof TRANSACTION_TYPES)[number], string> = {
  booking_payment: "Rental payment received",
  deposit: "Deposit collected",
  deposit_refund: "Deposit refunded",
  refund: "Refund issued",
  expense: "Expense",
  adjustment: "Adjustment",
};

export function PaymentDialog({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<(typeof TRANSACTION_TYPES)[number]>("booking_payment");
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]>("cash");
  const action = recordBookingPayment.bind(null, bookingId);
  const [state, formAction, pending] = useActionState<PaymentActionState, FormData>(action, {});

  useEffect(() => {
    if (state.success) {
      toast.success("Payment recorded.");
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-8 items-center gap-1 rounded-sm px-2 text-sm text-muted-foreground hover:text-foreground">
        <IndianRupee className="size-3.5" /> Payment
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="method" value={method} />
          <div>
            <Label className="mb-1.5 block">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_TYPES.filter((t) => t !== "adjustment").map((t) => (
                  <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="amount" className="mb-1.5 block">Amount (₹)</Label>
            <Input id="amount" name="amount" type="number" min={1} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="note" className="mb-1.5 block">Note (optional)</Label>
            <Input id="note" name="note" />
          </div>
          <DialogFooter>
            <DialogClose className="inline-flex h-9 items-center justify-center rounded-md border border-input px-4 text-sm">
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
