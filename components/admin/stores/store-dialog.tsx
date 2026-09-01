"use client";

import * as React from "react";
import { useActionState, useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
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
import type { StoreActionState } from "@/lib/actions/stores";

type StoreValues = {
  name: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

const empty: StoreValues = {
  name: "",
  phone: "",
  email: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

export function StoreDialog({
  action,
  initial,
  mode,
}: {
  action: (prev: StoreActionState, formData: FormData) => Promise<StoreActionState>;
  initial?: StoreValues;
  mode: "create" | "edit";
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<StoreActionState, FormData>(action, {});

  useEffect(() => {
    if (state.success) {
      toast.success(mode === "create" ? "Store created." : "Store updated.");
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const values = initial ?? empty;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={
          mode === "create"
            ? "inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            : "inline-flex h-8 items-center gap-2 rounded-sm px-2 text-sm text-muted-foreground hover:text-foreground"
        }
      >
        {mode === "create" ? (
          <>
            <Plus className="size-4" /> Add store
          </>
        ) : (
          <>
            <Pencil className="size-3.5" /> Edit
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add a store" : "Edit store"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Store name" name="name" defaultValue={values.name} className="sm:col-span-2" required />
          <Field label="Phone" name="phone" defaultValue={values.phone} />
          <Field label="Email" name="email" type="email" defaultValue={values.email} />
          <Field label="Address line 1" name="line1" defaultValue={values.line1} className="sm:col-span-2" />
          <Field label="Address line 2" name="line2" defaultValue={values.line2} className="sm:col-span-2" />
          <Field label="City" name="city" defaultValue={values.city} />
          <Field label="State" name="state" defaultValue={values.state} />
          <Field label="Pincode" name="pincode" defaultValue={values.pincode} />
          <DialogFooter className="sm:col-span-2">
            <DialogClose className="inline-flex h-9 items-center justify-center rounded-md border border-input px-4 text-sm">
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : mode === "create" ? "Create store" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  className,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      <Label htmlFor={name} className="mb-1.5 block">
        {label}
      </Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} />
    </div>
  );
}
