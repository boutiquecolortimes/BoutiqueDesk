"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";

export function AccountLogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/home");
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-secondary disabled:opacity-50"
    >
      <LogOut className="size-3.5" /> {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
