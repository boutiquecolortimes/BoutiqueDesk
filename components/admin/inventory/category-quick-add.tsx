"use client";

import * as React from "react";
import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { createCategory, type CategoryActionState } from "@/lib/actions/categories";

export function CategoryQuickAdd({
  onCreated,
}: {
  onCreated: (category: { id: string; name: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [state, formAction, pending] = useActionState<CategoryActionState, FormData>(
    createCategory,
    {}
  );

  useEffect(() => {
    if (state.success && state.id) {
      onCreated({ id: state.id, name });
      toast.success("Category added.");
      setOpen(false);
      setName("");
    } else if (state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex size-9 shrink-0 items-center justify-center rounded-md border border-input hover:bg-secondary">
        <Plus className="size-4" />
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New category</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <Input
            name="name"
            placeholder="e.g. Sarees, Sherwanis, Lehengas"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <DialogFooter>
            <DialogClose className="inline-flex h-9 items-center justify-center rounded-md border border-input px-4 text-sm">
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
