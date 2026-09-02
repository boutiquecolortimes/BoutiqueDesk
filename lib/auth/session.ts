import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE } from "./cookies";
import { verifyAccessToken, type AccessTokenPayload } from "./tokens";
import { isAdminRole, isOwnerRole, isPlatformRole } from "./roles";
import { getCurrentOrg } from "@/lib/tenant";

/**
 * Reads and verifies the current access token, and — for tenant-scoped roles —
 * confirms it belongs to the organization the current subdomain resolves to.
 * A token minted for one boutique presented on another boutique's subdomain
 * is rejected here, even though it's a validly-signed token. Returns null if
 * absent/invalid/expired/mismatched.
 */
export async function getSession(): Promise<AccessTokenPayload | null> {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = await verifyAccessToken(token);
    if (payload.orgId) {
      const org = await getCurrentOrg();
      if (!org || String(org._id) !== payload.orgId) return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/** For use in /admin server components: redirects to /login if not an admin-role user. */
export async function requireAdminSession(): Promise<AccessTokenPayload> {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    redirect("/login");
  }
  return session;
}

/** For pages/actions restricted to developer/super_admin (cross-store owners). */
export async function requireOwnerSession(): Promise<AccessTokenPayload> {
  const session = await getSession();
  if (!session || !isOwnerRole(session.role)) {
    redirect("/admin");
  }
  return session;
}

/** For BoutiqueDesk's own /platform panel — platform_admin only, no tenant. */
export async function requirePlatformSession(): Promise<AccessTokenPayload> {
  const session = await getSession();
  if (!session || !isPlatformRole(session.role)) {
    redirect("/login");
  }
  return session;
}

/**
 * The set of store IDs a session is scoped to. `null` means "all stores"
 * (developer / super_admin); otherwise it's the user's assigned stores.
 */
export function scopedStoreIds(session: AccessTokenPayload): string[] | null {
  if (isOwnerRole(session.role)) return null;
  return session.storeIds ?? [];
}
