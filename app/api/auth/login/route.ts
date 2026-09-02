import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken } from "@/lib/auth/tokens";
import { getCurrentOrg } from "@/lib/tenant";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  authCookieOptions,
} from "@/lib/auth/cookies";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }

  await connectToDatabase();

  // No subdomain (marketing/apex site) => only platform_admin accounts (organization: null)
  // can log in here. A tenant subdomain => only that org's users can log in.
  const org = await getCurrentOrg();
  const user = await User.findOne({
    email: parsed.data.email.toLowerCase(),
    organization: org ? org._id : null,
  });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
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
  const refreshToken = await signRefreshToken({
    sub: user._id.toString(),
    tokenVersion: user.tokenVersion,
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
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...authCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });

  return response;
}
