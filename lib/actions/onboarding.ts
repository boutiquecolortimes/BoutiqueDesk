"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/db/connect";
import { Organization } from "@/models/Organization";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { slugify } from "@/lib/utils";
import { ROOT_DOMAIN } from "@/lib/tenant-shared";

const OnboardingInput = z.object({
  businessName: z.string().min(2, "Business name is required."),
  ownerName: z.string().min(2, "Your name is required."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().optional().default(""),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type OnboardingActionState = { error?: string; success?: boolean; loginUrl?: string };

const TRIAL_DAYS = 1;

/**
 * Creates a new tenant Organization + its first super_admin user, signs them
 * in, and hands back the URL of their new subdomain to redirect to (a
 * server action can't redirect cross-host, so the client does that hop).
 */
export async function createOrganization(
  _prev: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const parsed = OnboardingInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const email = parsed.data.email.toLowerCase();
  const baseSlug = slugify(parsed.data.businessName);
  if (!baseSlug) return { error: "Please enter a valid business name." };

  let slug = baseSlug;
  let n = 1;
  while (await Organization.exists({ slug })) {
    slug = `${baseSlug}-${++n}`;
  }

  const org = await Organization.create({
    name: parsed.data.businessName,
    slug,
    plan: "trial",
    planStatus: "active",
    trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
    billingEmail: email,
  });

  await User.create({
    organization: org._id,
    name: parsed.data.ownerName,
    email,
    phone: parsed.data.phone,
    role: "super_admin",
    passwordHash: await hashPassword(parsed.data.password),
  });

  // Cookies are host-only (no shared domain attribute — see lib/auth/cookies.ts),
  // so a session set here on the apex/marketing host wouldn't be sent on the new
  // subdomain anyway. Send the browser there to sign in fresh instead.
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const currentHost = (await headers()).get("host") || ROOT_DOMAIN;
  const port = currentHost.includes(":") ? `:${currentHost.split(":")[1]}` : "";
  return {
    success: true,
    loginUrl: `${protocol}://${slug}.${ROOT_DOMAIN}${port}/login`,
  };
}
