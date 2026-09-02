import "server-only";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/db/connect";
import { Organization, type OrganizationDocument } from "@/models/Organization";
import { TENANT_SLUG_HEADER } from "@/lib/tenant-shared";

export { TENANT_SLUG_HEADER, ROOT_DOMAIN } from "@/lib/tenant-shared";

/** Reads the tenant slug proxy.ts resolved for this request. null on the marketing site. */
export async function getCurrentTenantSlug(): Promise<string | null> {
  const h = await headers();
  return h.get(TENANT_SLUG_HEADER) || null;
}

/**
 * Looks up the current request's Organization by the subdomain proxy.ts resolved.
 * Returns null on the marketing site (no subdomain) or if the subdomain doesn't
 * match any organization (unknown tenant).
 */
export async function getCurrentOrg(): Promise<OrganizationDocument | null> {
  const slug = await getCurrentTenantSlug();
  if (!slug) return null;
  await connectToDatabase();
  return Organization.findOne({ slug });
}
