/**
 * Roles across BoutiqueDesk:
 * - developer:    internal, full access everywhere, including the still-locked
 *                 public marketing site during active development.
 * - super_admin:  business owner — full access across every store.
 * - admin:        manages one or more assigned stores (inventory, bookings, revenue).
 * - staff:        day-to-day operations at their assigned store(s) — bookings,
 *                 inventory updates — but not store/team management or revenue exports.
 * - customer:      shopper on the public storefront (account, wishlist, orders).
 */
export const ROLES = [
  "developer",
  "super_admin",
  "admin",
  "staff",
  "customer",
] as const;

export type Role = (typeof ROLES)[number];

/** Roles allowed into /admin at all. Fine-grained permissions are checked per-page. */
export const ADMIN_ROLES: Role[] = ["developer", "super_admin", "admin", "staff"];

/** Roles that can manage stores, team members, and see cross-store revenue. */
export const OWNER_ROLES: Role[] = ["developer", "super_admin"];

/** Roles that can manage inventory & bookings but are scoped to their assigned store(s). */
export const STORE_ROLES: Role[] = ["admin", "staff"];

export function isAdminRole(role: string): role is Role {
  return (ADMIN_ROLES as string[]).includes(role);
}

export function isOwnerRole(role: string): role is Role {
  return (OWNER_ROLES as string[]).includes(role);
}
