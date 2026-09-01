"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { Store } from "@/models/Store";
import { requireOwnerSession } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";

const StoreInput = z.object({
  name: z.string().min(2, "Name is required."),
  phone: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")).default(""),
  line1: z.string().optional().default(""),
  line2: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  pincode: z.string().optional().default(""),
});

export type StoreActionState = { error?: string; success?: boolean };

export async function createStore(
  _prev: StoreActionState,
  formData: FormData
): Promise<StoreActionState> {
  await requireOwnerSession();
  const parsed = StoreInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();
  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  let n = 1;
  while (await Store.exists({ slug })) {
    slug = `${baseSlug}-${++n}`;
  }

  await Store.create({
    name: parsed.data.name,
    slug,
    phone: parsed.data.phone,
    email: parsed.data.email,
    address: {
      line1: parsed.data.line1,
      line2: parsed.data.line2,
      city: parsed.data.city,
      state: parsed.data.state,
      pincode: parsed.data.pincode,
    },
  });

  revalidatePath("/admin/stores");
  return { success: true };
}

export async function updateStore(
  storeId: string,
  _prev: StoreActionState,
  formData: FormData
): Promise<StoreActionState> {
  await requireOwnerSession();
  const parsed = StoreInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();
  await Store.findByIdAndUpdate(storeId, {
    $set: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      address: {
        line1: parsed.data.line1,
        line2: parsed.data.line2,
        city: parsed.data.city,
        state: parsed.data.state,
        pincode: parsed.data.pincode,
      },
    },
  });

  revalidatePath("/admin/stores");
  return { success: true };
}

export async function toggleStoreActive(storeId: string, isActive: boolean) {
  await requireOwnerSession();
  await connectToDatabase();
  await Store.findByIdAndUpdate(storeId, { $set: { isActive } });
  revalidatePath("/admin/stores");
}
