"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { Category } from "@/models/Category";
import { requireAdminSession } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";

const CategoryInput = z.object({ name: z.string().min(2, "Name is required.") });

export type CategoryActionState = { error?: string; success?: boolean; id?: string };

export async function createCategory(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  await requireAdminSession();
  const parsed = CategoryInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();
  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  let n = 1;
  while (await Category.exists({ slug })) {
    slug = `${baseSlug}-${++n}`;
  }

  const category = await Category.create({ name: parsed.data.name, slug });
  revalidatePath("/admin/inventory");
  return { success: true, id: String(category._id) };
}
