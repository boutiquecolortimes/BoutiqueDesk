"use client";

import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { setBookingStatus } from "@/lib/actions/bookings";
import type { BookingStatus } from "@/lib/constants";

const variants: Record<BookingStatus, "secondary" | "success" | "warning" | "destructive"> = {
  reserved: "secondary",
  active: "success",
  overdue: "warning",
  returned: "secondary",
  cancelled: "destructive",
};

const transitions: Record<BookingStatus, BookingStatus[]> = {
  reserved: ["active", "cancelled"],
  active: ["returned", "overdue", "cancelled"],
  overdue: ["returned", "cancelled"],
  returned: [],
  cancelled: [],
};

export function StatusMenu({ bookingId, status }: { bookingId: string; status: BookingStatus }) {
  const [pending, startTransition] = useTransition();
  const next = transitions[status];

  function handleSelect(newStatus: BookingStatus) {
    startTransition(async () => {
      try {
        await setBookingStatus(bookingId, newStatus);
        toast.success(`Marked as ${newStatus}.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not update status.");
      }
    });
  }

  if (next.length === 0) {
    return <Badge variant={variants[status]} className="capitalize">{status}</Badge>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={pending} className="disabled:opacity-50">
        <Badge variant={variants[status]} className="flex cursor-pointer items-center gap-1 capitalize">
          {status} <ChevronDown className="size-3" />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {next.map((s) => (
          <DropdownMenuItem key={s} className="capitalize" onClick={() => handleSelect(s)}>
            Mark {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
