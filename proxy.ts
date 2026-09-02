import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";
import { verifyAccessToken } from "@/lib/auth/tokens";
import { ADMIN_ROLES, PLATFORM_ROLES } from "@/lib/auth/roles";
import { TENANT_SLUG_HEADER, resolveTenantSlug } from "@/lib/tenant-shared";

// Requires any signed-in user (customer or staff) — used for the
// customer account area. Only meaningful on a tenant subdomain.
const AUTH_REQUIRED_PREFIXES = ["/account", "/wishlist"];

function redirectToLogin(request: NextRequest, pathname: string): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Optimistic route guard only — redirects when there is no valid access token,
 * or (for /admin) when the token's role isn't privileged enough. Actual token
 * refresh happens client-side against /api/auth/refresh (Node runtime,
 * DB-backed), since minting a real access token here would require a
 * database lookup Proxy's edge runtime isn't meant to perform.
 *
 * Multi-tenancy is resolved here too, by pure Host-header string parsing
 * (no DB call — edge runtime doesn't do DB lookups, see lib/tenant.ts for
 * the Node-runtime Organization lookup that uses the header this sets):
 * - No subdomain (apex domain, "www", or plain "localhost") → this is the
 *   public marketing/sales site. Fully open, no auth gate at all.
 * - A subdomain → this is one boutique's tenant. The x-tenant-slug header
 *   is attached for every downstream Server Component/Action, and the
 *   existing /admin, /account, /wishlist gating applies exactly as before.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const tenantSlug = resolveTenantSlug(request.headers.get("host"));

  const requestHeaders = new Headers(request.headers);
  if (tenantSlug) {
    requestHeaders.set(TENANT_SLUG_HEADER, tenantSlug);
  } else {
    requestHeaders.delete(TENANT_SLUG_HEADER);
  }
  const withTenantHeader = () => NextResponse.next({ request: { headers: requestHeaders } });

  // Marketing site (no tenant): public, except the internal /platform panel.
  if (!tenantSlug) {
    if (!pathname.startsWith("/platform")) {
      return withTenantHeader();
    }
    return gate(request, pathname, withTenantHeader, PLATFORM_ROLES);
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRequiredRoute = AUTH_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isAdminRoute && !isAuthRequiredRoute) {
    return withTenantHeader();
  }

  return gate(request, pathname, withTenantHeader, isAdminRoute ? ADMIN_ROLES : null);
}

async function gate(
  request: NextRequest,
  pathname: string,
  withTenantHeader: () => NextResponse,
  requiredRoles: string[] | null
): Promise<NextResponse> {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return redirectToLogin(request, pathname);
  }

  try {
    const payload = await verifyAccessToken(accessToken);

    if (requiredRoles && !requiredRoles.includes(payload.role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return withTenantHeader();
  } catch {
    return redirectToLogin(request, pathname);
  }
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets/images, so the tenant header
     * is attached to every request (needed for the marketing-vs-tenant
     * split above), not just the gated routes.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
