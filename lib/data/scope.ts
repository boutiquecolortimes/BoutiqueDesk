import { Types } from "mongoose";
import type { AccessTokenPayload } from "@/lib/auth/tokens";
import { scopedStoreIds } from "@/lib/auth/session";

/**
 * Mongo filter fragment restricting a `store` field to the session's
 * accessible stores. Empty object for owners (developer/super_admin) — no
 * restriction, they see every store.
 */
export function storeScopeFilter(session: AccessTokenPayload): Record<string, unknown> {
  const ids = scopedStoreIds(session);
  if (ids === null) return {};
  if (ids.length === 0) return { store: { $in: [] } }; // scoped user with no stores assigned yet
  return { store: { $in: ids.map((id) => new Types.ObjectId(id)) } };
}
