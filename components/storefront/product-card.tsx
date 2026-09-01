"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { Heart, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { toggleWishlist } from "@/lib/actions/public";

export interface StorefrontProduct {
  id: string;
  name: string;
  image?: string;
  rentalPricePerDay: number;
  storeName: string;
}

export function ProductCard({
  product,
  initiallyWishlisted = false,
  isLoggedIn = false,
}: {
  product: StorefrontProduct;
  initiallyWishlisted?: boolean;
  isLoggedIn?: boolean;
}) {
  const [wishlisted, setWishlisted] = useState(initiallyWishlisted);
  const [pending, startTransition] = useTransition();

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.info("Sign in to save items to your wishlist.");
      return;
    }
    startTransition(async () => {
      const result = await toggleWishlist(product.id);
      setWishlisted(result.wishlisted);
    });
  }

  return (
    <Link href={`/collections/${product.id}`} className="group flex flex-col gap-2">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-6" />
          </div>
        )}
        <button
          onClick={handleWishlist}
          disabled={pending}
          className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
        >
          <Heart className={cn("size-4", wishlisted && "fill-destructive text-destructive")} />
        </button>
      </div>
      <div>
        <p className="text-sm font-medium leading-tight">{product.name}</p>
        <p className="text-xs text-muted-foreground">{product.storeName}</p>
        <p className="mt-1 text-sm font-semibold text-accent">
          {formatCurrency(product.rentalPricePerDay)} <span className="text-xs font-normal text-muted-foreground">/ day</span>
        </p>
      </div>
    </Link>
  );
}
