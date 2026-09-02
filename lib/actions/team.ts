"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import { requireOwnerSession, getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

const TeamMemberInput = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().optional().default(""),
  role: z.enum(["admin", "staff"]),
  storeIds: z.union([z.string(), z.array(z.string())]).optional(),
  password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal("")),
});

export type TeamActionState = { error?: string; success?: boolean };

function normalizeStoreIds(input: string | string[] | undefined): string[] {
  if (!input) return [];
  return Array.isArray(input) ? input : [input];
}

export async function inviteTeamMember(
  _prev: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const session = await requireOwnerSession();
  const parsed = TeamMemberInput.safeParse({
    ...Object.fromEntries(formData),
    storeIds: formData.getAll("storeIds"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  if (!parsed.data.password) {
    return { error: "A temporary password is required for new team members." };
  }

  await connectToDatabase();
  const email = parsed.data.email.toLowerCase();
  if (await User.exists({ email, organization: session.orgId })) {
    return { error: "A user with this email already exists." };
  }

  await User.create({
    organization: session.orgId!,
    name: parsed.data.name,
    email,
    phone: parsed.data.phone,
    role: parsed.data.role,
    storeIds: normalizeStoreIds(parsed.data.storeIds),
    passwordHash: await hashPassword(parsed.data.password),
  });

  revalidatePath("/admin/team");
  return { success: true };
}

export async function updateTeamMember(
  userId: string,
  _prev: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const session = await requireOwnerSession();
  const parsed = TeamMemberInput.safeParse({
    ...Object.fromEntries(formData),
    storeIds: formData.getAll("storeIds"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();
  const update: Record<string, unknown> = {
    name: parsed.data.name,
    phone: parsed.data.phone,
    role: parsed.data.role,
    storeIds: normalizeStoreIds(parsed.data.storeIds),
  };
  if (parsed.data.password) {
    update.passwordHash = await hashPassword(parsed.data.password);
  }

  await User.findOneAndUpdate({ _id: userId, organization: session.orgId }, { $set: update });
  revalidatePath("/admin/team");
  return { success: true };
}

export async function setTeamMemberActive(userId: string, isActive: boolean) {
  const session = await requireOwnerSession();
  if (session.sub === userId && !isActive) {
    throw new Error("You can't deactivate your own account.");
  }
  await connectToDatabase();
  // Bumping tokenVersion invalidates any existing refresh tokens for this user.
  await User.findOneAndUpdate({ _id: userId, organization: session.orgId }, {
    $set: { isActive },
    $inc: { tokenVersion: 1 },
  });
  revalidatePath("/admin/team");
}

export async function currentSessionUserId() {
  const session = await getSession();
  return session?.sub ?? null;
}
