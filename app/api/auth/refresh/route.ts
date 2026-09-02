import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import { signAccessToken, verifyRefreshToken } from "@/lib/auth/tokens";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  authCookieOptions,
} from "@/lib/auth/cookies";

/**
 * Node-runtime, DB-backed refresh — mints a fresh short-lived access token
 * from the httpOnly refresh cookie. proxy.ts's edge checks are optimistic
 * only; this route is the real source of truth.
 */
export async function POST(request: Request) {
  const refreshToken = request.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith(`${REFRESH_TOKEN_COOKIE}=`))
    ?.split("=")[1];

  if (!refreshToken) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let payload;
  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch {
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  }

  await connectToDatabase();
  const user = await User.findById(payload.sub);

  if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  }

  const storeIds = user.storeIds.map((id) => id.toString());

  const accessToken = await signAccessToken({
    sub: user._id.toString(),
    role: user.role,
    email: user.email,
    name: user.name,
    storeIds,
    orgId: user.organization ? String(user.organization) : null,
  });

  const response = NextResponse.json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      storeIds,
    },
  });

  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...authCookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });

  return response;
}
