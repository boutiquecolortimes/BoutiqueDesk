"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { Product, PRODUCT_STATUSES } from "@/models/Product";
import { Store } from "@/models/Store";
import { requireAdminSession } from "@/lib/auth/session";
import { isOwnerRole } from "@/lib/auth/roles";
import { slugify } from "@/lib/utils";

const SizeInput = z.object({
  size: z.string().min(1),
  totalQuantity: z.coerce.number().min(0),
});

const ProductInput = z.object({
  name: z.string().min(2, "Name is required."),
  storeId: z.string().min(1, "Store is required."),
  categoryId: z.string().optional().default(""),
  sku: z.string().optional().default(""),
  description: z.string().optional().default(""),
  rentalPricePerDay: z.coerce.number().min(0),
  securityDeposit: z.coerce.number().min(0).default(0),
  purchasePrice: z.coerce.number().min(0).optional(),
  status: z.enum(PRODUCT_STATUSES).default("active"),
  isPubliclyVisible: z.string().optional(),
  isFeatured: z.string().optional(),
  sizesJson: z.string(),
  imagesJson: z.string(),
});

export type ProductActionState = { error?: string; success?: boolean };

function parseInput(formData: FormData) {
  const parsed = ProductInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." } as const;
  }

  let sizes: z.infer<typeof SizeInput>[] = [];
  let images: string[] = [];
  try {
    sizes = z.array(SizeInput).min(1, "Add at least one size.").parse(JSON.parse(parsed.data.sizesJson));
    images = z.array(z.string()).parse(JSON.parse(parsed.data.imagesJson));
  } catch {
    return { error: "Invalid sizes or images." } as const;
  }

  return { data: parsed.data, sizes, images } as const;
}

async function assertStoreAccess(storeId: string) {
  const session = await requireAdminSession();
  if (!isOwnerRole(session.role) && !session.storeIds.includes(storeId)) {
    throw new Error("You don't have access to that store.");
  }
  // Tenant boundary: the store must belong to the caller's own organization,
  // regardless of role — an owner is only unrestricted *within* their org.
  await connectToDatabase();
  const store = await Store.findOne({ _id: storeId, organization: session.orgId }).select("_id");
  if (!store) {
    throw new Error("You don't have access to that store.");
  }
  return session;
}

export async function createProduct(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const parsed = parseInput(formData);
  if ("error" in parsed) return { error: parsed.error };
  const { data, sizes, images } = parsed;

  let session;
  try {
    session = await assertStoreAccess(data.storeId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized." };
  }

  await connectToDatabase();
  const baseSlug = slugify(data.name);
  let slug = baseSlug;
  let n = 1;
  while (await Product.exists({ store: data.storeId, slug })) {
    slug = `${baseSlug}-${++n}`;
  }

  await Product.create({
    organization: session.orgId!,
    store: data.storeId,
    category: data.categoryId || undefined,
    name: data.name,
    slug,
    sku: data.sku,
    description: data.description,
    images,
    sizes: sizes.map((s) => ({ ...s, rentedQuantity: 0 })),
    rentalPricePerDay: data.rentalPricePerDay,
    securityDeposit: data.securityDeposit,
    purchasePrice: data.purchasePrice,
    status: data.status,
    isPubliclyVisible: Boolean(data.isPubliclyVisible),
    isFeatured: Boolean(data.isFeatured),
  });

  revalidatePath("/admin/inventory");
  return { success: true };
}

export async function updateProduct(
  productId: string,
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const parsed = parseInput(formData);
  if ("error" in parsed) return { error: parsed.error };
  const { data, sizes, images } = parsed;

  let session;
  try {
    session = await assertStoreAccess(data.storeId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized." };
  }

  await connectToDatabase();
  const existing = await Product.findOne({ _id: productId, organization: session.orgId });
  if (!existing) return { error: "Product not found." };

  // Preserve rentedQuantity per size where the size still exists.
  const rentedBySize = new Map(existing.sizes.map((s) => [s.size, s.rentedQuantity]));

  await Product.findByIdAndUpdate(productId, {
    $set: {
      store: data.storeId,
      category: data.categoryId || undefined,
      name: data.name,
      sku: data.sku,
      description: data.description,
      images,
      sizes: sizes.map((s) => ({ ...s, rentedQuantity: rentedBySize.get(s.size) ?? 0 })),
      rentalPricePerDay: data.rentalPricePerDay,
      securityDeposit: data.securityDeposit,
      purchasePrice: data.purchasePrice,
      status: data.status,
      isPubliclyVisible: Boolean(data.isPubliclyVisible),
      isFeatured: Boolean(data.isFeatured),
    },
  });

  revalidatePath("/admin/inventory");
  return { success: true };
}

export async function archiveProduct(productId: string) {
  const session = await requireAdminSession();
  await connectToDatabase();
  const product = await Product.findOne({ _id: productId, organization: session.orgId });
  if (!product) throw new Error("Product not found.");
  if (!isOwnerRole(session.role) && !session.storeIds.includes(String(product.store))) {
    throw new Error("You don't have access to that store.");
  }
  product.status = "retired";
  product.isPubliclyVisible = false;
  await product.save();
  revalidatePath("/admin/inventory");
}
