"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { Organization, ORG_PLANS, ORG_PLAN_STATUSES } from "@/models/Organization";
import { requirePlatformSession } from "@/lib/auth/session";

const UpdateOrgInput = z.object({
  plan: z.enum(ORG_PLANS),
  planStatus: z.enum(ORG_PLAN_STATUSES),
});

/** platform_admin only: manually flip a tenant's plan/status (no billing integration yet). */
export async function updateOrganizationPlan(orgId: string, formData: FormData) {
  await requirePlatformSession();
  const parsed = UpdateOrgInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid input.");

  await connectToDatabase();
  await Organization.findByIdAndUpdate(orgId, {
    $set: { plan: parsed.data.plan, planStatus: parsed.data.planStatus },
  });
  revalidatePath("/platform");
}
