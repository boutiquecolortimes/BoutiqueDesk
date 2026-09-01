"use client";

import * as React from "react";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type SizeRow = { size: string; totalQuantity: number };

export function SizeEditor({ initial = [{ size: "Free size", totalQuantity: 1 }] }: { initial?: SizeRow[] }) {
  const [rows, setRows] = useState<SizeRow[]>(initial.length ? initial : [{ size: "Free size", totalQuantity: 1 }]);

  function update(index: number, patch: Partial<SizeRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { size: "", totalQuantity: 1 }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="sizesJson" value={JSON.stringify(rows)} />
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            placeholder="Size (e.g. S, M, Free)"
            value={row.size}
            onChange={(e) => update(i, { size: e.target.value })}
            className="flex-1"
          />
          <Input
            type="number"
            min={0}
            placeholder="Qty"
            value={row.totalQuantity}
            onChange={(e) => update(i, { totalQuantity: Number(e.target.value) })}
            className="w-24"
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            disabled={rows.length === 1}
            className="text-muted-foreground hover:text-destructive disabled:opacity-30"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="flex w-fit items-center gap-1 text-xs font-medium text-accent hover:underline"
      >
        <Plus className="size-3.5" /> Add size
      </button>
    </div>
  );
}
