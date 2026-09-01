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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { TeamActionState } from "@/lib/actions/team";

type TeamValues = {
  name: string;
  email: string;
  phone: string;
  role: "admin" | "staff";
  storeIds: string[];
};

const empty: TeamValues = { name: "", email: "", phone: "", role: "staff", storeIds: [] };

export function TeamDialog({
  action,
  initial,
  mode,
  stores,
}: {
  action: (prev: TeamActionState, formData: FormData) => Promise<TeamActionState>;
  initial?: TeamValues;
  mode: "create" | "edit";
  stores: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"admin" | "staff">(initial?.role ?? "staff");
  const [state, formAction, pending] = useActionState<TeamActionState, FormData>(action, {});

  useEffect(() => {
    if (state.success) {
      toast.success(mode === "create" ? "Team member added." : "Team member updated.");
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
            <Plus className="size-4" /> Add team member
          </>
        ) : (
          <>
            <Pencil className="size-3.5" /> Edit
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add a team member" : "Edit team member"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="name" className="mb-1.5 block">Name</Label>
              <Input id="name" name="name" defaultValue={values.name} required />
            </div>
            <div>
              <Label htmlFor="email" className="mb-1.5 block">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={values.email} required disabled={mode === "edit"} />
            </div>
            <div>
              <Label htmlFor="phone" className="mb-1.5 block">Phone</Label>
              <Input id="phone" name="phone" defaultValue={values.phone} />
            </div>
            <div>
              <Label className="mb-1.5 block">Role</Label>
              <Select name="role" value={role} onValueChange={(v) => setRole(v as "admin" | "staff")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Assigned stores</Label>
            <div className="flex flex-wrap gap-3 rounded-md border border-input p-3">
              {stores.length === 0 && (
                <p className="text-xs text-muted-foreground">Add a store first.</p>
              )}
              {stores.map((store) => (
                <label key={store.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="storeIds"
                    value={store.id}
                    defaultChecked={values.storeIds.includes(store.id)}
                    className="size-4 rounded border-input accent-primary"
                  />
                  {store.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="mb-1.5 block">
              {mode === "create" ? "Temporary password" : "Reset password (optional)"}
            </Label>
            <Input
              id="password"
              name="password"
              type="text"
              placeholder={mode === "create" ? "Share this with them securely" : "Leave blank to keep current password"}
              required={mode === "create"}
            />
          </div>

          <DialogFooter>
            <DialogClose className="inline-flex h-9 items-center justify-center rounded-md border border-input px-4 text-sm">
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : mode === "create" ? "Add member" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
