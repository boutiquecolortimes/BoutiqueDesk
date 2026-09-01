"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { toggleStoreActive } from "@/lib/actions/stores";

export function StoreActiveToggle({ storeId, isActive }: { storeId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await toggleStoreActive(storeId, !isActive);
      toast.success(!isActive ? "Store activated." : "Store deactivated.");
    });
  }

  return (
    <button onClick={toggle} disabled={pending} className="cursor-pointer disabled:opacity-50">
      <Badge variant={isActive ? "success" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
    </button>
  );
}
