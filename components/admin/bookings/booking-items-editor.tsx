"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

export type BookableProduct = {
  id: string;
  name: string;
  rentalPricePerDay: number;
  sizes: { size: string; available: number }[];
};

type Row = { productId: string; size: string; quantity: number };

export function BookingItemsEditor({
  products,
  days,
  onRentalAmountChange,
}: {
  products: BookableProduct[];
  days: number;
  onRentalAmountChange?: (amount: number) => void;
}) {
  const [rows, setRows] = useState<Row[]>([
    { productId: products[0]?.id ?? "", size: products[0]?.sizes[0]?.size ?? "", quantity: 1 },
  ]);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const total = rows.reduce((sum, r) => {
    const p = productById.get(r.productId);
    return sum + (p ? p.rentalPricePerDay * r.quantity * days : 0);
  }, 0);

  React.useEffect(() => {
    onRentalAmountChange?.(total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  function update(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { productId: products[0]?.id ?? "", size: products[0]?.sizes[0]?.size ?? "", quantity: 1 }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground">No active inventory in this store yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="itemsJson" value={JSON.stringify(rows.filter((r) => r.productId && r.size))} />
      {rows.map((row, i) => {
        const product = productById.get(row.productId);
        const sizeOptions = product?.sizes ?? [];
        return (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2">
            <select
              className="h-9 flex-1 min-w-40 rounded-md border border-input bg-background px-2 text-sm"
              value={row.productId}
              onChange={(e) => {
                const next = productById.get(e.target.value);
                update(i, { productId: e.target.value, size: next?.sizes[0]?.size ?? "" });
              }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              className="h-9 w-28 rounded-md border border-input bg-background px-2 text-sm"
              value={row.size}
              onChange={(e) => update(i, { size: e.target.value })}
            >
              {sizeOptions.map((s) => (
                <option key={s.size} value={s.size} disabled={s.available <= 0}>
                  {s.size} ({s.available} left)
                </option>
              ))}
            </select>
            <Input
              type="number"
              min={1}
              value={row.quantity}
              onChange={(e) => update(i, { quantity: Math.max(1, Number(e.target.value)) })}
              className="w-20"
            />
            <span className="w-24 text-right text-sm text-muted-foreground">
              {product ? formatCurrency(product.rentalPricePerDay * row.quantity * days) : "—"}
            </span>
            <button type="button" onClick={() => removeRow(i)} disabled={rows.length === 1} className="text-muted-foreground hover:text-destructive disabled:opacity-30">
              <X className="size-4" />
            </button>
          </div>
        );
      })}
      <div className="flex items-center justify-between">
        <button type="button" onClick={addRow} className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
          <Plus className="size-3.5" /> Add item
        </button>
        <span className="text-sm font-medium">Rental total: {formatCurrency(total)}</span>
      </div>
    </div>
  );
}
