// Dependency-free constants shared between proxy.ts (edge runtime) and
// lib/tenant.ts (Node runtime). Keeping this free of "next/headers" and
// mongoose imports is deliberate — proxy.ts runs at the edge and must not
// pull in server-only/DB code (see lib/constants.ts for the same pattern
// applied to client-bundle safety).

/** Header proxy.ts attaches once it has parsed the tenant slug out of the Host header. */
export const TENANT_SLUG_HEADER = "x-tenant-slug";

/**
 * Root domain the platform runs on, e.g. "boutiquedesk.app". Subdomains of
 * this (acme.boutiquedesk.app) resolve to a tenant; the bare domain and
 * "www" resolve to the marketing/sales site. Overridable via env so this is
 * a one-line change once a real domain is wired up.
 */
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "boutiquedesk.app";

/** Extracts the tenant subdomain from a request Host header, or null for the marketing site. */
export function resolveTenantSlug(hostHeader: string | null): string | null {
  if (!hostHeader) return null;
  const hostname = hostHeader.split(":")[0].toLowerCase();

  // Local dev: "tenant.localhost:3000" — no DNS setup required, resolves to 127.0.0.1
  // automatically in every modern browser/OS.
  if (hostname === "localhost" || hostname === "127.0.0.1") return null;
  if (hostname.endsWith(".localhost")) {
    const sub = hostname.slice(0, -".localhost".length);
    return sub || null;
  }

  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) return null;
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    return hostname.slice(0, -(`.${ROOT_DOMAIN}`.length + 1));
  }

  // Anything else (a "buy"-plan dedicated custom domain) isn't slug-addressable
  // here; resolving those is a future extension (look up Organization.customDomain).
  return null;
}
