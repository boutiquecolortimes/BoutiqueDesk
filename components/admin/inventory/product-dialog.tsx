"use client";

import * as React from "react";
import { useActionState, useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
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
import { ImageUploader } from "./image-uploader";
import { SizeEditor } from "./size-editor";
import { CategoryQuickAdd } from "./category-quick-add";
import type { ProductActionState } from "@/lib/actions/products";
import { PRODUCT_STATUSES } from "@/lib/constants";

type ProductValues = {
  name: string;
  storeId: string;
  categoryId: string;
  sku: string;
  description: string;
  rentalPricePerDay: string;
  securityDeposit: string;
  purchasePrice: string;
  status: (typeof PRODUCT_STATUSES)[number];
  isPubliclyVisible: boolean;
  isFeatured: boolean;
  sizes: { size: string; totalQuantity: number }[];
  images: string[];
};

const empty: ProductValues = {
  name: "",
  storeId: "",
  categoryId: "",
  sku: "",
  description: "",
  rentalPricePerDay: "",
  securityDeposit: "",
  purchasePrice: "",
  status: "active",
  isPubliclyVisible: true,
  isFeatured: false,
  sizes: [{ size: "Free size", totalQuantity: 1 }],
  images: [],
};

export function ProductDialog({
  action,
  initial,
  mode,
  stores,
  categories: initialCategories,
}: {
  action: (prev: ProductActionState, formData: FormData) => Promise<ProductActionState>;
  initial?: ProductValues;
  mode: "create" | "edit";
  stores: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState(initialCategories);
  const [storeId, setStoreId] = useState(initial?.storeId ?? stores[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId || "none");
  const [status, setStatus] = useState(initial?.status ?? "active");
  const [state, formAction, pending] = useActionState<ProductActionState, FormData>(action, {});

  useEffect(() => {
    if (state.success) {
      toast.success(mode === "create" ? "Item added." : "Item updated.");
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
            <Plus className="size-4" /> Add item
          </>
        ) : (
          <>
            <Pencil className="size-3.5" /> Edit
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add inventory item" : "Edit inventory item"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="storeId" value={storeId} />
          <input type="hidden" name="categoryId" value={categoryId === "none" ? "" : categoryId} />
          <input type="hidden" name="status" value={status} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name" className="mb-1.5 block">Name</Label>
              <Input id="name" name="name" defaultValue={values.name} required />
            </div>

            {stores.length > 1 && (
              <div>
                <Label className="mb-1.5 block">Store</Label>
                <Select value={storeId} onValueChange={(v) => setStoreId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select store" />
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
              <Label className="mb-1.5 block">Category</Label>
              <div className="flex items-center gap-2">
                <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "none")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Uncategorized" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <CategoryQuickAdd
                  onCreated={(cat) => {
                    setCategories((prev) => [...prev, cat]);
                    setCategoryId(cat.id);
                  }}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="sku" className="mb-1.5 block">SKU (optional)</Label>
              <Input id="sku" name="sku" defaultValue={values.sku} />
            </div>

            <div>
              <Label className="mb-1.5 block">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rentalPricePerDay" className="mb-1.5 block">Rental price / day (₹)</Label>
              <Input
                id="rentalPricePerDay"
                name="rentalPricePerDay"
                type="number"
                min={0}
                defaultValue={values.rentalPricePerDay}
                required
              />
            </div>
            <div>
              <Label htmlFor="securityDeposit" className="mb-1.5 block">Security deposit (₹)</Label>
              <Input
                id="securityDeposit"
                name="securityDeposit"
                type="number"
                min={0}
                defaultValue={values.securityDeposit}
              />
            </div>
            <div>
              <Label htmlFor="purchasePrice" className="mb-1.5 block">Cost price (₹, optional)</Label>
              <Input id="purchasePrice" name="purchasePrice" type="number" min={0} defaultValue={values.purchasePrice} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="description" className="mb-1.5 block">Description</Label>
              <Textarea id="description" name="description" defaultValue={values.description} rows={3} />
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Sizes &amp; stock</Label>
              <SizeEditor initial={values.sizes} />
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Photos</Label>
              <ImageUploader initial={values.images} />
            </div>

            <div className="flex items-center gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPubliclyVisible" defaultChecked={values.isPubliclyVisible} className="size-4 accent-primary" />
                Visible on storefront
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isFeatured" defaultChecked={values.isFeatured} className="size-4 accent-primary" />
                Featured
              </label>
            </div>
          </div>

          <DialogFooter>
            <DialogClose className="inline-flex h-9 items-center justify-center rounded-md border border-input px-4 text-sm">
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : mode === "create" ? "Add item" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
