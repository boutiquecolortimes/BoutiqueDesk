"use client";

import { useTransition } from "react";
import { Archive } from "lucide-react";
import { toast } from "sonner";
import { archiveProduct } from "@/lib/actions/products";

export function ArchiveButton({ productId }: { productId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        await archiveProduct(productId);
        toast.success("Item retired.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not update.");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title="Retire item"
      className="flex size-8 items-center justify-center rounded-sm text-muted-foreground hover:text-destructive disabled:opacity-50"
    >
      <Archive className="size-3.5" />
    </button>
  );
}
