"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { setTeamMemberActive } from "@/lib/actions/team";

export function TeamActiveToggle({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      try {
        await setTeamMemberActive(userId, !isActive);
        toast.success(!isActive ? "Member activated." : "Member deactivated.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not update.");
      }
    });
  }

  return (
    <button onClick={toggle} disabled={pending} className="cursor-pointer disabled:opacity-50">
      <Badge variant={isActive ? "success" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
    </button>
  );
}
