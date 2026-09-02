import { Types } from "mongoose";
import type { AccessTokenPayload } from "@/lib/auth/tokens";
import { scopedStoreIds } from "@/lib/auth/session";

/**
 * Mongo filter fragment restricting a query to the session's tenant
 * organization, and — for store-scoped roles (admin/staff) — further to
 * their assigned store(s). Owners (developer/super_admin) get every store
 * within their own organization only; this is the tenant isolation
 * boundary, never platform-wide.
 */
export function storeScopeFilter(session: AccessTokenPayload): Record<string, unknown> {
  const filter: Record<string, unknown> = orgScopeFilter(session);
  const ids = scopedStoreIds(session);
  if (ids === null) return filter; // owner role: every store in their org
  if (ids.length === 0) return { ...filter, store: { $in: [] } }; // scoped user with no stores assigned yet
  return { ...filter, store: { $in: ids.map((id) => new Types.ObjectId(id)) } };
}

/** Mongo filter fragment restricting a query to the session's tenant organization. */
export function orgScopeFilter(session: AccessTokenPayload): Record<string, unknown> {
  if (!session.orgId) return {}; // platform_admin — not scoped to a tenant
  return { organization: new Types.ObjectId(session.orgId) };
}
