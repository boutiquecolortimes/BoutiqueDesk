import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";
import { verifyAccessToken } from "@/lib/auth/tokens";
import { ADMIN_ROLES } from "@/lib/auth/roles";

// Requires any signed-in user (customer or staff) — used for the
// customer account area.
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
 * The public marketing site (/home, /collections, etc.) is open to everyone —
 * no gate. Only /admin (staff/owners) and the customer account area
 * (/account, /wishlist) require sign-in.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRequiredRoute = AUTH_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isAdminRoute && !isAuthRequiredRoute) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return redirectToLogin(request, pathname);
  }

  try {
    const payload = await verifyAccessToken(accessToken);

    if (isAdminRoute && !ADMIN_ROLES.includes(payload.role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    return redirectToLogin(request, pathname);
  }
}

export const config = {
  matcher: ["/account/:path*", "/wishlist/:path*", "/admin/:path*"],
};
