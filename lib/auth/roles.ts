/**
 * Roles across BoutiqueDesk:
 * - platform_admin: BoutiqueDesk's own team — not tied to any tenant organization,
 *                    manages the directory of signed-up boutiques (trial/plan status).
 *                    Every role below this is scoped to a single tenant Organization.
 * - developer:    internal, full access everywhere within their organization.
 * - super_admin:  business owner — full access across every store in their org.
 * - admin:        manages one or more assigned stores (inventory, bookings, revenue).
 * - staff:        day-to-day operations at their assigned store(s) — bookings,
 *                 inventory updates — but not store/team management or revenue exports.
 * - customer:      shopper on a boutique's public storefront (account, wishlist, orders).
 */
export const ROLES = [
  "platform_admin",
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

/** BoutiqueDesk's own team — not scoped to any organization. */
export const PLATFORM_ROLES: Role[] = ["platform_admin"];

export function isPlatformRole(role: string): role is Role {
  return (PLATFORM_ROLES as string[]).includes(role);
}

export function isAdminRole(role: string): role is Role {
  return (ADMIN_ROLES as string[]).includes(role);
}

export function isOwnerRole(role: string): role is Role {
  return (OWNER_ROLES as string[]).includes(role);
}
