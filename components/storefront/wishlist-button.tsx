"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleWishlist } from "@/lib/actions/public";

export function WishlistButton({
  productId,
  initiallyWishlisted,
  isLoggedIn,
}: {
  productId: string;
  initiallyWishlisted: boolean;
  isLoggedIn: boolean;
}) {
  const [wishlisted, setWishlisted] = useState(initiallyWishlisted);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!isLoggedIn) {
      toast.info("Sign in to save items to your wishlist.");
      return;
    }
    startTransition(async () => {
      const result = await toggleWishlist(productId);
      setWishlisted(result.wishlisted);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-secondary"
    >
      <Heart className={cn("size-4", wishlisted && "fill-destructive text-destructive")} />
      {wishlisted ? "Saved" : "Save for later"}
    </button>
  );
}
